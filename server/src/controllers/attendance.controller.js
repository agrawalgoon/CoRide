import { prisma } from '../config/db.js';
import {
  distanceMeters,
  generateTotpSecret,
  deriveTotpToken,
  sha256
} from '../services/attendance/attendance.utils.js';

// ------------------------------------------------------------------
// Shared select shape for attendance log responses
// ------------------------------------------------------------------
const logSelect = {
  id: true,
  bookingId: true,
  rideId: true,
  passengerId: true,
  method: true,
  driverLatitude: true,
  driverLongitude: true,
  passengerLatitude: true,
  passengerLongitude: true,
  distanceToPickupMeters: true,
  isGeofenceValid: true,
  verifiedAt: true
  // tokenHash intentionally excluded from all responses
};

// ------------------------------------------------------------------
// POST /api/attendance/initiate
//
// Called by the DRIVER to activate attendance for a ride.
// Generates a rotating TOTP secret stored on the ride row.
// Returns the current short token so the driver can display it
// or embed it in a QR code — without ever exposing the raw secret.
// ------------------------------------------------------------------
export const initiateAttendance = async (req, res, next) => {
  try {
    const { rideId } = req.body;

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

    if (ride.status !== 'ACTIVE' && ride.status !== 'SCHEDULED') {
      return res.status(400).json({
        success: false,
        message: `Attendance cannot be initiated for a ride with status '${ride.status}'.`
      });
    }

    // Generate or reuse TOTP secret
    const secret = ride.activeTotpSecret || generateTotpSecret();

    if (!ride.activeTotpSecret) {
      await prisma.ride.update({
        where: { id: rideId },
        data: { activeTotpSecret: secret }
      });
    }

    // Derive current 90-second window token — driver shows this (or encodes in QR)
    const token = deriveTotpToken(secret);

    return res.status(200).json({
      success: true,
      message: 'Attendance session initiated. Token rotates every 90 seconds.',
      data: {
        rideId,
        token,           // 8-char rotating token shown in QR or shared with passenger
        windowSeconds: 90
      }
    });
  } catch (err) {
    next(err);
  }
};

// ------------------------------------------------------------------
// POST /api/attendance/verify-qr
//
// Called by the PASSENGER to verify attendance via QR token.
// Passenger submits the token they scanned and their current location.
// Backend re-derives the token from the stored secret and checks match.
// Also validates geofence if passenger location is provided.
// ------------------------------------------------------------------
export const verifyQr = async (req, res, next) => {
  try {
    const {
      bookingId,
      token,
      passengerLatitude,
      passengerLongitude
    } = req.body;

    if (!bookingId || !token) {
      return res.status(400).json({ success: false, message: 'bookingId and token are required.' });
    }

    // Load booking with ride relationship
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

    // Ownership check — passenger can only verify their own booking
    if (booking.passengerId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'You can only verify attendance for your own booking.' });
    }

    // Booking must be ACCEPTED to attend
    if (booking.status !== 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        message: `Attendance not allowed for booking with status '${booking.status}'.`
      });
    }

    // Duplicate attendance check
    if (booking.isAttended) {
      return res.status(409).json({ success: false, message: 'Attendance already recorded for this booking.' });
    }

    // Ride must have an active TOTP secret
    const { ride } = booking;
    if (!ride.activeTotpSecret) {
      return res.status(400).json({ success: false, message: 'Attendance has not been initiated by the driver yet.' });
    }

    // Verify token (current window and previous window for clock drift tolerance)
    const expectedCurrent = deriveTotpToken(ride.activeTotpSecret);
    const expectedPrev = deriveTotpToken(ride.activeTotpSecret, 90); // previous window placeholder
    const submittedToken = String(token).trim().toUpperCase();

    if (submittedToken !== expectedCurrent && submittedToken !== expectedPrev) {
      return res.status(400).json({ success: false, message: 'Invalid or expired QR token. Please scan a fresh code.' });
    }

    // Geofence validation (optional — only if passenger provides coordinates)
    let distMeters = null;
    let isGeofenceValid = null;

    if (passengerLatitude !== undefined && passengerLongitude !== undefined) {
      const pLat = Number(passengerLatitude);
      const pLon = Number(passengerLongitude);

      if (!Number.isFinite(pLat) || !Number.isFinite(pLon)) {
        return res.status(400).json({ success: false, message: 'Invalid passenger coordinates.' });
      }

      distMeters = distanceMeters(
        pLat, pLon,
        ride.originLatitude, ride.originLongitude
      );
      isGeofenceValid = distMeters <= ride.geofenceRadiusMeters;
    }

    // Mark attendance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update booking
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          isAttended: true,
          attendedAt: new Date(),
          attendanceMethod: 'DYNAMIC_QR',
          attendanceDistanceMeters: distMeters
        },
        select: {
          id: true,
          rideId: true,
          passengerId: true,
          status: true,
          isAttended: true,
          attendedAt: true,
          attendanceMethod: true,
          attendanceDistanceMeters: true
        }
      });

      // Write audit log
      const log = await tx.attendanceLog.create({
        data: {
          bookingId,
          rideId: ride.id,
          passengerId: req.user.userId,
          method: 'DYNAMIC_QR',
          passengerLatitude: passengerLatitude !== undefined ? Number(passengerLatitude) : null,
          passengerLongitude: passengerLongitude !== undefined ? Number(passengerLongitude) : null,
          distanceToPickupMeters: distMeters,
          isGeofenceValid,
          tokenHash: sha256(submittedToken)
        },
        select: logSelect
      });

      // Notify driver
      await tx.notification.create({
        data: {
          recipientId: ride.driverId,
          senderId: req.user.userId,
          type: 'ATTENDANCE_SUCCESS',
          title: 'Passenger Boarded',
          message: 'A passenger has successfully verified attendance via QR.',
          metadata: { bookingId, rideId: ride.id }
        }
      });

      return { updatedBooking, log };
    });

    return res.status(200).json({
      success: true,
      message: 'Attendance verified successfully.',
      data: {
        booking: result.updatedBooking,
        attendanceLog: result.log,
        geofence: isGeofenceValid !== null
          ? { valid: isGeofenceValid, distanceMeters: Math.round(distMeters) }
          : null
      }
    });
  } catch (err) {
    next(err);
  }
};

// ------------------------------------------------------------------
// POST /api/attendance/verify-geofence
//
// Called by the PASSENGER to verify attendance by geofence only.
// No QR token required — passenger must be within ride geofence radius.
// Driver must have already set the ride to ACTIVE.
// ------------------------------------------------------------------
export const verifyGeofence = async (req, res, next) => {
  try {
    const {
      bookingId,
      passengerLatitude,
      passengerLongitude
    } = req.body;

    if (!bookingId || passengerLatitude === undefined || passengerLongitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'bookingId, passengerLatitude and passengerLongitude are required.'
      });
    }

    const pLat = Number(passengerLatitude);
    const pLon = Number(passengerLongitude);

    if (!Number.isFinite(pLat) || !Number.isFinite(pLon)) {
      return res.status(400).json({ success: false, message: 'Invalid passenger coordinates.' });
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
            originLatitude: true,
            originLongitude: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.passengerId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'You can only verify attendance for your own booking.' });
    }

    if (booking.status !== 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        message: `Attendance not allowed for booking with status '${booking.status}'.`
      });
    }

    if (booking.isAttended) {
      return res.status(409).json({ success: false, message: 'Attendance already recorded for this booking.' });
    }

    const { ride } = booking;
    const distMeters = distanceMeters(pLat, pLon, ride.originLatitude, ride.originLongitude);
    const isGeofenceValid = distMeters <= ride.geofenceRadiusMeters;

    if (!isGeofenceValid) {
      return res.status(400).json({
        success: false,
        message: `You are ${Math.round(distMeters)}m from the pickup point. Must be within ${ride.geofenceRadiusMeters}m.`,
        data: {
          distanceMeters: Math.round(distMeters),
          requiredMeters: ride.geofenceRadiusMeters
        }
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          isAttended: true,
          attendedAt: new Date(),
          attendanceMethod: 'MANUAL_OTP',   // re-using MANUAL_OTP for geofence-only
          attendanceDistanceMeters: distMeters
        },
        select: {
          id: true,
          rideId: true,
          passengerId: true,
          status: true,
          isAttended: true,
          attendedAt: true,
          attendanceMethod: true,
          attendanceDistanceMeters: true
        }
      });

      const log = await tx.attendanceLog.create({
        data: {
          bookingId,
          rideId: ride.id,
          passengerId: req.user.userId,
          method: 'MANUAL_OTP',
          passengerLatitude: pLat,
          passengerLongitude: pLon,
          distanceToPickupMeters: distMeters,
          isGeofenceValid: true
        },
        select: logSelect
      });

      await tx.notification.create({
        data: {
          recipientId: ride.driverId,
          senderId: req.user.userId,
          type: 'ATTENDANCE_SUCCESS',
          title: 'Passenger Boarded',
          message: 'A passenger has verified attendance via geofence.',
          metadata: { bookingId, rideId: ride.id }
        }
      });

      return { updatedBooking, log };
    });

    return res.status(200).json({
      success: true,
      message: 'Attendance verified via geofence.',
      data: {
        booking: result.updatedBooking,
        attendanceLog: result.log,
        geofence: { valid: true, distanceMeters: Math.round(distMeters) }
      }
    });
  } catch (err) {
    next(err);
  }
};

// ------------------------------------------------------------------
// GET /api/attendance/my
//
// Returns the authenticated passenger's full attendance history.
// ------------------------------------------------------------------
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
            status: true
          }
        },
        booking: {
          select: {
            id: true,
            seatsBooked: true,
            fareContributionTotal: true,
            status: true
          }
        }
      }
    });

    return res.status(200).json({ success: true, count: logs.length, attendanceLogs: logs });
  } catch (err) {
    next(err);
  }
};

// ------------------------------------------------------------------
// GET /api/attendance/ride/:rideId
//
// Returns all attendance logs for a specific ride.
// Only the driver of that ride may call this.
// ------------------------------------------------------------------
export const getRideAttendance = async (req, res, next) => {
  try {
    const { rideId } = req.params;

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      select: { driverId: true }
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
        },
        booking: {
          select: {
            id: true,
            seatsBooked: true,
            pickupAddress: true,
            status: true
          }
        }
      }
    });

    return res.status(200).json({ success: true, count: logs.length, attendanceLogs: logs });
  } catch (err) {
    next(err);
  }
};
