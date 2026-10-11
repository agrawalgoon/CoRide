import { prisma } from '../config/db.js';
import {
  distanceMeters,
  checkGeofence,
  generateTotpSecret,
  deriveTotpToken,
  verifyTotpToken,
  generateSignedQrToken,
  verifySignedQrToken,
  sha256,
  MAX_REASONABLE_ACCURACY_METERS
} from '../services/attendance/attendance.utils.js';

// Shared select fields for attendance logs
const logSelect = {
  id: true,
  bookingId: true,
  rideId: true,
  passengerId: true,
  method: true,
  status: true,
  driverLatitude: true,
  driverLongitude: true,
  passengerLatitude: true,
  passengerLongitude: true,
  accuracyMeters: true,
  locationDenied: true,
  distanceToPickupMeters: true,
  isGeofenceValid: true,
  notes: true,
  verifiedAt: true
};

const MAX_ARRIVAL_GPS_ACCURACY_METERS = 150; // Reject if GPS inaccuracy exceeds 150m

/**
 * Validate numeric latitude and longitude boundaries.
 */
const validateCoordinates = (lat, lon) => {
  const nLat = Number(lat);
  const nLon = Number(lon);
  if (!Number.isFinite(nLat) || !Number.isFinite(nLon)) {
    return { valid: false, error: 'Coordinates must be valid numbers.' };
  }
  if (nLat < -90 || nLat > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90 degrees.' };
  }
  if (nLon < -180 || nLon > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180 degrees.' };
  }
  return { valid: true, latitude: nLat, longitude: nLon };
};

// ==================================================================
// 1. POST /api/attendance/rides/:rideId/start or POST /api/attendance/initiate
// Driver starts ride (SCHEDULED -> ACTIVE) and issues rotating QR token.
// ==================================================================
export const initiateAttendance = async (req, res, next) => {
  try {
    const rideId = req.params.rideId || req.body.rideId;

    if (!rideId) {
      return res.status(400).json({ success: false, message: 'rideId is required.' });
    }

    const ride = await prisma.ride.findUnique({ where: { id: rideId } });

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found.' });
    }

    if (ride.driverId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Only the driver can initiate attendance for this ride.' });
    }

    if (ride.status === 'COMPLETED' || ride.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: `Attendance cannot be initiated for a ride with status '${ride.status}'.`
      });
    }

    // Generate or reuse TOTP secret
    const secret = ride.activeTotpSecret || generateTotpSecret();

    // Transition SCHEDULED -> ACTIVE if starting attendance
    if (ride.status === 'SCHEDULED' || !ride.activeTotpSecret) {
      await prisma.ride.update({
        where: { id: rideId },
        data: {
          status: 'ACTIVE',
          activeTotpSecret: secret
        }
      });
    }

    // Generate short-lived signed dynamic QR token (60 seconds TTL)
    const qrToken = generateSignedQrToken(
      { rideId, type: 'DRIVER_BOARDING_QR' },
      secret,
      60
    );

    // Fallback TOTP token (90 seconds window)
    const totpToken = deriveTotpToken(secret, 90);

    return res.status(200).json({
      success: true,
      message: 'Attendance session initiated. Dynamic QR token expires in 60 seconds.',
      data: {
        rideId,
        status: 'ACTIVE',
        qrToken,
        totpToken,
        ttlSeconds: 60,
        expiresAt: Date.now() + 60 * 1000
      }
    });
  } catch (err) {
    next(err);
  }
};

// ==================================================================
// 2. GET or POST /api/attendance/rides/:rideId/qr-token
// Refresh/fetch current dynamic QR token for active ride (Driver only).
// ==================================================================
export const getRideQrToken = async (req, res, next) => {
  try {
    const { rideId } = req.params;

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      select: { id: true, driverId: true, status: true, activeTotpSecret: true }
    });

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found.' });
    }

    if (ride.driverId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Only the driver can request the ride QR token.' });
    }

    if (ride.status !== 'ACTIVE' && ride.status !== 'SCHEDULED') {
      return res.status(400).json({
        success: false,
        message: `Cannot issue QR token for ride with status '${ride.status}'.`
      });
    }

    const secret = ride.activeTotpSecret || generateTotpSecret();
    if (!ride.activeTotpSecret) {
      await prisma.ride.update({
        where: { id: rideId },
        data: { activeTotpSecret: secret }
      });
    }

    const qrToken = generateSignedQrToken(
      { rideId, type: 'DRIVER_BOARDING_QR' },
      secret,
      60
    );

    return res.status(200).json({
      success: true,
      data: {
        rideId,
        qrToken,
        ttlSeconds: 60,
        expiresAt: Date.now() + 60 * 1000
      }
    });
  } catch (err) {
    next(err);
  }
};

// ==================================================================
// 3. POST /api/attendance/passenger-token (Passenger)
// Passenger requests their own dynamic boarding pass QR token to
// display to the driver.
// ==================================================================
export const getPassengerBoardingToken = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required.' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ride: { select: { id: true, driverId: true, activeTotpSecret: true, status: true } }
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.passengerId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'You can only get a boarding pass for your own booking.' });
    }

    if (booking.status !== 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        message: `Cannot generate boarding pass for booking with status '${booking.status}'.`
      });
    }

    if (booking.isAttended || booking.status === 'BOARDED' || booking.status === 'ARRIVED') {
      return res.status(409).json({ success: false, message: 'Booking has already been boarded.' });
    }

    const secret = booking.ride.activeTotpSecret || generateTotpSecret();
    if (!booking.ride.activeTotpSecret) {
      await prisma.ride.update({
        where: { id: booking.ride.id },
        data: { activeTotpSecret: secret }
      });
    }

    const qrToken = generateSignedQrToken(
      {
        bookingId: booking.id,
        passengerId: booking.passengerId,
        rideId: booking.rideId,
        type: 'PASSENGER_BOARDING_PASS'
      },
      secret,
      60
    );

    return res.status(200).json({
      success: true,
      message: 'Passenger boarding pass generated.',
      data: {
        bookingId: booking.id,
        rideId: booking.rideId,
        qrToken,
        ttlSeconds: 60,
        expiresAt: Date.now() + 60 * 1000
      }
    });
  } catch (err) {
    next(err);
  }
};

// ==================================================================
// 4. POST /api/attendance/verify-qr (Passenger scans Driver QR)
// Validates token signature/expiration, checks booking ownership,
// performs proximity check with accuracy limits, logs audit trail,
// atomic transaction prevents concurrency race conditions.
// ==================================================================
export const verifyQr = async (req, res, next) => {
  try {
    const {
      bookingId,
      token,
      passengerLatitude,
      passengerLongitude,
      accuracyMeters,
      locationPermissionDenied = false
    } = req.body;

    if (!bookingId || !token) {
      return res.status(400).json({ success: false, message: 'bookingId and token are required.' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ride: {
          select: {
            id: true,
            driverId: true,
            status: true,
            activeTotpSecret: true,
            geofenceRadiusMeters: true,
            originLatitude: true,
            originLongitude: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Ownership check: Passenger can only check in against their own booking
    if (booking.passengerId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'You can only verify attendance for your own booking.' });
    }

    // Controlled transition check: must be ACCEPTED (BOOKED)
    if (booking.status !== 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        message: `Attendance not allowed for booking with status '${booking.status}'. Must be in 'ACCEPTED' (BOOKED) status.`
      });
    }

    if (booking.isAttended || booking.status === 'BOARDED' || booking.status === 'ARRIVED') {
      return res.status(409).json({ success: false, message: 'Attendance already recorded for this booking.' });
    }

    const { ride } = booking;
    if (ride.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Cannot verify attendance for a cancelled ride.' });
    }

    if (!ride.activeTotpSecret) {
      return res.status(400).json({ success: false, message: 'Attendance has not been initiated by the driver yet.' });
    }

    const submittedToken = String(token).trim();

    // 1. Verify token signature / format
    let isTokenValid = false;
    let tokenPayload = null;

    if (submittedToken.includes('.')) {
      const verification = verifySignedQrToken(submittedToken, ride.activeTotpSecret);
      if (!verification.valid) {
        return res.status(400).json({
          success: false,
          message: verification.error || 'Invalid or expired QR code.',
          code: verification.code
        });
      }
      tokenPayload = verification.payload;
      if (tokenPayload.rideId !== ride.id) {
        return res.status(400).json({ success: false, message: 'QR token is not valid for this ride.' });
      }
      isTokenValid = true;
    } else {
      // 2. Fallback: Check rotating TOTP code
      isTokenValid = verifyTotpToken(submittedToken, ride.activeTotpSecret, 90);
      if (!isTokenValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired code. Please scan a fresh code or refresh OTP.'
        });
      }
    }

    // Single-use / Replay attack protection: check if this token hash was already logged
    const tokenHashValue = sha256(submittedToken);
    const existingLog = await prisma.attendanceLog.findFirst({
      where: { tokenHash: tokenHashValue }
    });

    if (existingLog) {
      return res.status(409).json({
        success: false,
        message: 'This QR code has already been used. Please scan a newly generated code.'
      });
    }

    // Location & Proximity verification (optional / gracefully handles permission denial)
    let distMeters = null;
    let isGeofenceValid = null;
    let hasLocation = false;
    const isDenied = Boolean(locationPermissionDenied);

    if (
      !isDenied &&
      passengerLatitude !== undefined &&
      passengerLongitude !== undefined &&
      passengerLatitude !== null &&
      passengerLongitude !== null
    ) {
      const coordCheck = validateCoordinates(passengerLatitude, passengerLongitude);
      if (coordCheck.valid) {
        hasLocation = true;
        const targetLat = booking.pickupLatitude ?? ride.originLatitude;
        const targetLon = booking.pickupLongitude ?? ride.originLongitude;

        const geofenceResult = checkGeofence(
          targetLat,
          targetLon,
          coordCheck.latitude,
          coordCheck.longitude,
          ride.geofenceRadiusMeters,
          accuracyMeters
        );

        distMeters = geofenceResult.rawDistanceMeters;
        isGeofenceValid = geofenceResult.valid;
      }
    }

    const now = new Date();

    // Atomic transaction: prevents concurrent duplicate check-ins
    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.booking.updateMany({
        where: {
          id: bookingId,
          status: 'ACCEPTED',
          isAttended: false
        },
        data: {
          status: 'BOARDED',
          isAttended: true,
          attendedAt: now,
          boardingAt: now,
          attendanceMethod: 'DYNAMIC_QR',
          attendanceDistanceMeters: distMeters
        }
      });

      if (updateResult.count === 0) {
        throw new Error('CONCURRENT_DUPLICATE_OR_INVALID_STATE');
      }

      const log = await tx.attendanceLog.create({
        data: {
          bookingId,
          rideId: ride.id,
          passengerId: req.user.userId,
          method: 'DYNAMIC_QR',
          status: 'BOARDED',
          passengerLatitude: hasLocation ? Number(passengerLatitude) : null,
          passengerLongitude: hasLocation ? Number(passengerLongitude) : null,
          accuracyMeters: accuracyMeters ? Number(accuracyMeters) : null,
          locationDenied: isDenied || !hasLocation,
          distanceToPickupMeters: distMeters,
          isGeofenceValid,
          tokenHash: tokenHashValue,
          notes: isDenied ? 'Passenger denied geolocation permission' : null
        },
        select: logSelect
      });

      await tx.notification.create({
        data: {
          recipientId: ride.driverId,
          senderId: req.user.userId,
          type: 'ATTENDANCE_SUCCESS',
          title: 'Passenger Boarded',
          message: 'Passenger verified attendance via dynamic QR scan.',
          metadata: { bookingId, rideId: ride.id, status: 'BOARDED' }
        }
      });

      return { log };
    });

    const updatedBooking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    return res.status(200).json({
      success: true,
      message: 'Boarding verified successfully. Welcome aboard!',
      data: {
        booking: updatedBooking,
        attendanceLog: result.log,
        proximity: isGeofenceValid !== null
          ? { valid: isGeofenceValid, distanceMeters: distMeters }
          : null,
        locationDenied: isDenied || !hasLocation
      }
    });
  } catch (err) {
    if (
      err.message === 'CONCURRENT_DUPLICATE_OR_INVALID_STATE' ||
      err.code === 'P2002' // Unique constraint violation (e.g. tokenHash)
    ) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already recorded or QR token was already redeemed.'
      });
    }
    next(err);
  }
};

// ==================================================================
// 5. POST /api/attendance/scan-passenger-qr (Driver scans Passenger Pass)
// Driver scans the passenger's screen.
// ==================================================================
export const scanPassengerQr = async (req, res, next) => {
  try {
    const {
      qrToken,
      driverLatitude,
      driverLongitude,
      accuracyMeters
    } = req.body;

    if (!qrToken) {
      return res.status(400).json({ success: false, message: 'qrToken is required.' });
    }

    const submittedToken = String(qrToken).trim();
    if (!submittedToken.includes('.')) {
      return res.status(400).json({ success: false, message: 'Invalid passenger boarding token format.' });
    }

    // Decode unverified payload to find rideId & activeTotpSecret
    const parts = submittedToken.split('.');
    let rawPayload;
    try {
      rawPayload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Malformed QR payload.' });
    }

    const { bookingId, rideId } = rawPayload;
    if (!bookingId || !rideId) {
      return res.status(400).json({ success: false, message: 'Missing required claims in boarding token.' });
    }

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      select: { id: true, driverId: true, activeTotpSecret: true, geofenceRadiusMeters: true }
    });

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found.' });
    }

    if (ride.driverId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'You are not the driver of this ride.' });
    }

    // Verify token cryptographic signature
    const verification = verifySignedQrToken(submittedToken, ride.activeTotpSecret);
    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.error || 'Invalid or expired passenger QR code.',
        code: verification.code
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.status !== 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        message: `Booking has status '${booking.status}'. Cannot board.`
      });
    }

    if (booking.isAttended || booking.status === 'BOARDED') {
      return res.status(409).json({ success: false, message: 'Passenger has already been boarded.' });
    }

    const tokenHashValue = sha256(submittedToken);
    const existingLog = await prisma.attendanceLog.findFirst({
      where: { tokenHash: tokenHashValue }
    });
    if (existingLog) {
      return res.status(409).json({ success: false, message: 'This boarding pass has already been used.' });
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.booking.updateMany({
        where: {
          id: bookingId,
          status: 'ACCEPTED',
          isAttended: false
        },
        data: {
          status: 'BOARDED',
          isAttended: true,
          attendedAt: now,
          boardingAt: now,
          attendanceMethod: 'DYNAMIC_QR'
        }
      });

      if (updateResult.count === 0) {
        throw new Error('CONCURRENT_DUPLICATE_OR_INVALID_STATE');
      }

      const log = await tx.attendanceLog.create({
        data: {
          bookingId,
          rideId: ride.id,
          passengerId: booking.passengerId,
          method: 'DYNAMIC_QR',
          status: 'BOARDED',
          driverLatitude: driverLatitude !== undefined ? Number(driverLatitude) : null,
          driverLongitude: driverLongitude !== undefined ? Number(driverLongitude) : null,
          accuracyMeters: accuracyMeters ? Number(accuracyMeters) : null,
          tokenHash: tokenHashValue,
          notes: 'Boarded by driver scan'
        },
        select: logSelect
      });

      await tx.notification.create({
        data: {
          recipientId: booking.passengerId,
          senderId: req.user.userId,
          type: 'ATTENDANCE_SUCCESS',
          title: 'Boarded Successfully',
          message: 'Your driver has scanned your boarding pass. Enjoy the ride!',
          metadata: { bookingId, rideId: ride.id, status: 'BOARDED' }
        }
      });

      return { log };
    });

    const updatedBooking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    return res.status(200).json({
      success: true,
      message: 'Passenger boarded successfully.',
      data: {
        booking: updatedBooking,
        attendanceLog: result.log
      }
    });
  } catch (err) {
    if (
      err.message === 'CONCURRENT_DUPLICATE_OR_INVALID_STATE' ||
      err.code === 'P2002'
    ) {
      return res.status(409).json({
        success: false,
        message: 'Passenger has already been boarded or token has already been used.'
      });
    }
    next(err);
  }
};

// ==================================================================
// 6. POST /api/attendance/verify-arrival (Destination Arrival Geofence)
// Passenger verifies destination arrival using their booking-specific
// destination (not driver's final destination).
// Validates coordinates and GPS accuracy.
// ==================================================================
export const verifyArrival = async (req, res, next) => {
  try {
    const {
      bookingId,
      latitude,
      longitude,
      accuracy,
      accuracyMeters
    } = req.body;

    if (!bookingId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'bookingId, latitude, and longitude are required.'
      });
    }

    // 1. Validate coordinates range and finite numeric values
    const coordCheck = validateCoordinates(latitude, longitude);
    if (!coordCheck.valid) {
      return res.status(400).json({ success: false, message: coordCheck.error });
    }

    // 2. Validate GPS accuracy limit
    const reportedAccuracy = Number(accuracyMeters ?? accuracy);
    if (!Number.isFinite(reportedAccuracy) || reportedAccuracy < 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid non-negative GPS accuracy value (in meters) must be provided.'
      });
    }

    if (reportedAccuracy > MAX_ARRIVAL_GPS_ACCURACY_METERS) {
      return res.status(400).json({
        success: false,
        message: `GPS accuracy is too poor (${Math.round(reportedAccuracy)}m). Must be ${MAX_ARRIVAL_GPS_ACCURACY_METERS}m or better to verify arrival.`,
        data: {
          reportedAccuracyMeters: Math.round(reportedAccuracy),
          maxAllowedAccuracyMeters: MAX_ARRIVAL_GPS_ACCURACY_METERS
        }
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ride: {
          select: {
            id: true,
            driverId: true,
            status: true,
            geofenceRadiusMeters: true,
            destinationLatitude: true,
            destinationLongitude: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Authorization: Passenger verifies their own booking arrival
    if (booking.passengerId !== req.user.userId && booking.ride.driverId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to verify arrival for this booking.' });
    }

    // Controlled transition check: must be in BOARDED status
    if (booking.status === 'ARRIVED') {
      return res.status(409).json({ success: false, message: 'Arrival has already been verified for this booking.' });
    }

    if (booking.status !== 'BOARDED') {
      return res.status(400).json({
        success: false,
        message: `Arrival can only be verified for passengers in 'BOARDED' status. Current status is '${booking.status}'.`
      });
    }

    // CRITICAL: Use the passenger's booking-specific destination (drop coordinates),
    // NOT the driver's final ride destination!
    const targetLat = booking.dropLatitude ?? booking.ride.destinationLatitude;
    const targetLon = booking.dropLongitude ?? booking.ride.destinationLongitude;
    const allowedRadius = booking.ride.geofenceRadiusMeters || 150;

    const geofence = checkGeofence(
      targetLat,
      targetLon,
      coordCheck.latitude,
      coordCheck.longitude,
      allowedRadius,
      reportedAccuracy
    );

    if (!geofence.valid) {
      return res.status(400).json({
        success: false,
        message: `You are ${geofence.rawDistanceMeters}m away from your drop location (${booking.dropAddress}). Must be within ${allowedRadius}m.`,
        data: {
          distanceMeters: geofence.rawDistanceMeters,
          allowedRadiusMeters: allowedRadius,
          accuracyMeters: geofence.accuracyMeters,
          destinationAddress: booking.dropAddress
        }
      });
    }

    const now = new Date();

    // Atomic transaction: prevents concurrent duplicate arrival verification
    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.booking.updateMany({
        where: {
          id: bookingId,
          status: 'BOARDED',
          arrivedAt: null
        },
        data: {
          status: 'ARRIVED',
          arrivedAt: now
        }
      });

      if (updateResult.count === 0) {
        throw new Error('CONCURRENT_DUPLICATE_OR_INVALID_STATE');
      }

      const log = await tx.attendanceLog.create({
        data: {
          bookingId,
          rideId: booking.rideId,
          passengerId: booking.passengerId,
          method: 'CAMPUS_GEOFENCE',
          status: 'ARRIVED',
          passengerLatitude: coordCheck.latitude,
          passengerLongitude: coordCheck.longitude,
          accuracyMeters: Math.round(reportedAccuracy),
          distanceToPickupMeters: geofence.rawDistanceMeters,
          isGeofenceValid: true,
          notes: `Arrived at passenger drop destination: ${booking.dropAddress}`
        },
        select: logSelect
      });

      await tx.notification.create({
        data: {
          recipientId: booking.ride.driverId,
          senderId: req.user.userId,
          type: 'ATTENDANCE_SUCCESS',
          title: 'Passenger Arrived',
          message: `Passenger arrived at destination (${booking.dropAddress}).`,
          metadata: { bookingId, rideId: booking.rideId, status: 'ARRIVED' }
        }
      });

      return { log };
    });

    const updatedBooking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    return res.status(200).json({
      success: true,
      message: 'Destination arrival successfully verified via geofence.',
      data: {
        booking: updatedBooking,
        attendanceLog: result.log,
        geofence: {
          distanceMeters: geofence.rawDistanceMeters,
          allowedRadiusMeters: allowedRadius,
          destinationAddress: booking.dropAddress
        }
      }
    });
  } catch (err) {
    if (err.message === 'CONCURRENT_DUPLICATE_OR_INVALID_STATE') {
      return res.status(409).json({
        success: false,
        message: 'Arrival has already been recorded or booking is no longer in BOARDED state.'
      });
    }
    next(err);
  }
};

// ==================================================================
// 7. POST /api/attendance/mark-no-show (Driver marks passenger NO_SHOW)
// ==================================================================
export const markNoShow = async (req, res, next) => {
  try {
    const { bookingId, reason } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required.' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ride: { select: { id: true, driverId: true, status: true, availableSeats: true } }
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.ride.driverId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Only the driver can mark a passenger as no-show.' });
    }

    if (booking.status === 'BOARDED' || booking.status === 'ARRIVED') {
      return res.status(400).json({
        success: false,
        message: `Cannot mark a passenger who has already ${booking.status.toLowerCase()} as NO_SHOW.`
      });
    }

    if (booking.status !== 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        message: `Only bookings in 'ACCEPTED' status can be marked as NO_SHOW. Current status: '${booking.status}'.`
      });
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.booking.updateMany({
        where: {
          id: bookingId,
          status: 'ACCEPTED'
        },
        data: {
          status: 'NO_SHOW',
          noShowAt: now,
          cancellationReason: reason || 'Passenger did not show up at pickup point'
        }
      });

      if (updateResult.count === 0) {
        throw new Error('CONCURRENT_DUPLICATE_OR_INVALID_STATE');
      }

      if (booking.ride.status === 'SCHEDULED' || booking.ride.status === 'ACTIVE') {
        await tx.ride.update({
          where: { id: booking.rideId },
          data: {
            availableSeats: { increment: booking.seatsBooked }
          }
        });
      }

      const log = await tx.attendanceLog.create({
        data: {
          bookingId,
          rideId: booking.rideId,
          passengerId: booking.passengerId,
          method: 'DRIVER_OVERRIDE',
          status: 'NO_SHOW',
          notes: reason || 'Driver marked passenger as NO_SHOW'
        },
        select: logSelect
      });

      await tx.notification.create({
        data: {
          recipientId: booking.passengerId,
          senderId: req.user.userId,
          type: 'ATTENDANCE_NO_SHOW',
          title: 'Marked as No-Show',
          message: `The driver marked you as no-show for this ride. Reason: ${reason || 'Passenger not at pickup point'}`,
          metadata: { bookingId, rideId: booking.rideId, status: 'NO_SHOW' }
        }
      });

      return { log };
    });

    const updatedBooking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    return res.status(200).json({
      success: true,
      message: 'Passenger marked as NO_SHOW successfully. Seat capacity restored.',
      data: {
        booking: updatedBooking,
        attendanceLog: result.log
      }
    });
  } catch (err) {
    if (err.message === 'CONCURRENT_DUPLICATE_OR_INVALID_STATE') {
      return res.status(409).json({
        success: false,
        message: 'Booking is no longer in ACCEPTED state.'
      });
    }
    next(err);
  }
};

// ==================================================================
// 8. POST /api/attendance/driver-override (Driver Manual Boarding Override)
// ==================================================================
export const driverOverride = async (req, res, next) => {
  try {
    const { bookingId, reason } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required.' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ride: { select: { id: true, driverId: true, status: true } }
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.ride.driverId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Only the driver can perform manual override.' });
    }

    if (booking.status !== 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        message: `Only bookings in 'ACCEPTED' status can be boarded. Current status: '${booking.status}'.`
      });
    }

    if (booking.isAttended || booking.status === 'BOARDED') {
      return res.status(409).json({ success: false, message: 'Booking already recorded as attended.' });
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.booking.updateMany({
        where: {
          id: bookingId,
          status: 'ACCEPTED',
          isAttended: false
        },
        data: {
          status: 'BOARDED',
          isAttended: true,
          attendedAt: now,
          boardingAt: now,
          attendanceMethod: 'DRIVER_OVERRIDE'
        }
      });

      if (updateResult.count === 0) {
        throw new Error('CONCURRENT_DUPLICATE_OR_INVALID_STATE');
      }

      const log = await tx.attendanceLog.create({
        data: {
          bookingId,
          rideId: booking.rideId,
          passengerId: booking.passengerId,
          method: 'DRIVER_OVERRIDE',
          status: 'BOARDED',
          notes: reason ? `Driver manual override: ${reason}` : 'Driver manual override'
        },
        select: logSelect
      });

      await tx.notification.create({
        data: {
          recipientId: booking.passengerId,
          senderId: req.user.userId,
          type: 'ATTENDANCE_SUCCESS',
          title: 'Boarded (Driver Override)',
          message: 'The driver confirmed your boarding via manual override.',
          metadata: { bookingId, rideId: booking.rideId, status: 'BOARDED' }
        }
      });

      return { log };
    });

    const updatedBooking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    return res.status(200).json({
      success: true,
      message: 'Passenger boarded via driver override.',
      data: {
        booking: updatedBooking,
        attendanceLog: result.log
      }
    });
  } catch (err) {
    if (err.message === 'CONCURRENT_DUPLICATE_OR_INVALID_STATE') {
      return res.status(409).json({
        success: false,
        message: 'Booking is no longer in ACCEPTED state.'
      });
    }
    next(err);
  }
};

// ==================================================================
// 9. GET /api/attendance/my (Passenger Attendance History)
// ==================================================================
export const getMyAttendance = async (req, res, next) => {
  try {
    const logs = await prisma.attendanceLog.findMany({
      where: { passengerId: req.user.userId },
      orderBy: { verifiedAt: 'desc' },
      select: {
        ...logSelect,
        ride: {
          select: {
            id: true,
            originAddress: true,
            destinationAddress: true,
            departureTime: true,
            status: true,
            driver: {
              select: { id: true, name: true, avatarUrl: true }
            }
          }
        },
        booking: {
          select: {
            id: true,
            pickupAddress: true,
            dropAddress: true,
            seatsBooked: true,
            fareContributionTotal: true,
            status: true,
            boardingAt: true,
            arrivedAt: true
          }
        }
      }
    });

    return res.status(200).json({ success: true, count: logs.length, attendanceLogs: logs });
  } catch (err) {
    next(err);
  }
};

// ==================================================================
// 10. GET /api/attendance/ride/:rideId (Driver View)
// ==================================================================
export const getRideAttendance = async (req, res, next) => {
  try {
    const { rideId } = req.params;

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      select: {
        id: true,
        driverId: true,
        status: true,
        bookings: {
          select: {
            id: true,
            passengerId: true,
            seatsBooked: true,
            pickupAddress: true,
            dropAddress: true,
            status: true,
            isAttended: true,
            boardingAt: true,
            arrivedAt: true,
            passenger: {
              select: { id: true, name: true, avatarUrl: true, phone: true }
            }
          }
        }
      }
    });

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found.' });
    }

    if (ride.driverId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Only the driver can view attendance for this ride.' });
    }

    const logs = await prisma.attendanceLog.findMany({
      where: { rideId },
      orderBy: { verifiedAt: 'asc' },
      select: {
        ...logSelect,
        passenger: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            phone: true
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      rideId,
      rideStatus: ride.status,
      bookings: ride.bookings,
      logsCount: logs.length,
      attendanceLogs: logs
    });
  } catch (err) {
    next(err);
  }
};

// ==================================================================
// 11. GET /api/attendance/organization/:orgId (Organization Admin View)
// ==================================================================
export const getOrganizationAttendance = async (req, res, next) => {
  try {
    const { orgId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true, organizationId: true }
    });

    if (user?.role !== 'ADMIN' && user?.organizationId !== orgId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view organization attendance records.'
      });
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, campusHubName: true, geofenceRadiusMeters: true }
    });

    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found.' });
    }

    const logs = await prisma.attendanceLog.findMany({
      where: {
        passenger: { organizationId: orgId }
      },
      orderBy: { verifiedAt: 'desc' },
      take: 200,
      select: {
        ...logSelect,
        passenger: {
          select: { id: true, name: true, email: true, orgRole: true }
        },
        ride: {
          select: {
            id: true,
            originAddress: true,
            destinationAddress: true,
            departureTime: true,
            driver: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    const totalRecords = logs.length;
    const boardedCount = logs.filter((l) => l.status === 'BOARDED').length;
    const arrivedCount = logs.filter((l) => l.status === 'ARRIVED').length;
    const noShowCount = logs.filter((l) => l.status === 'NO_SHOW').length;
    const qrScansCount = logs.filter((l) => l.method === 'DYNAMIC_QR').length;
    const geofenceVerifiedCount = logs.filter((l) => l.isGeofenceValid === true).length;

    return res.status(200).json({
      success: true,
      organization: org,
      metrics: {
        totalRecords,
        boardedCount,
        arrivedCount,
        noShowCount,
        qrScansCount,
        geofenceVerifiedCount
      },
      logs
    });
  } catch (err) {
    next(err);
  }
};
