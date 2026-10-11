import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initiateAttendance,
  getRideQrToken,
  verifyQr,
  verifyArrival,
  markNoShow,
  getOrganizationAttendance
} from '../src/controllers/attendance.controller.js';
import {
  generateSignedQrToken,
  generateTotpSecret,
  sha256
} from '../src/services/attendance/attendance.utils.js';
import { prisma } from '../src/config/db.js';

// Helper to construct mock Express req/res
const createMockReqRes = ({ user, body = {}, params = {}, query = {} }) => {
  const req = {
    user: user || { userId: 'user-default', role: 'USER' },
    body,
    params,
    query
  };
  let statusCode = 200;
  let jsonResponse = null;
  let errorPassed = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      jsonResponse = data;
      return this;
    }
  };

  const next = (err) => {
    if (err) errorPassed = err;
  };

  return {
    req,
    res,
    getStatus: () => statusCode,
    getJson: () => jsonResponse,
    getError: () => errorPassed,
    next
  };
};

test('E1. Valid Boarding: Authorized passenger successfully boards with valid dynamic QR', async () => {
  const secret = generateTotpSecret();
  const validToken = generateSignedQrToken({ rideId: 'ride-1', type: 'DRIVER_BOARDING_QR' }, secret, 60);

  const origBookingFind = prisma.booking.findUnique;
  const origLogFind = prisma.attendanceLog.findFirst;
  const origTransaction = prisma.$transaction;

  prisma.booking.findUnique = async () => ({
    id: 'booking-1',
    passengerId: 'passenger-1',
    status: 'ACCEPTED',
    isAttended: false,
    pickupLatitude: 37.4275,
    pickupLongitude: -122.1697,
    ride: {
      id: 'ride-1',
      driverId: 'driver-1',
      status: 'ACTIVE',
      activeTotpSecret: secret,
      geofenceRadiusMeters: 150,
      originLatitude: 37.4275,
      originLongitude: -122.1697
    }
  });

  prisma.attendanceLog.findFirst = async () => null; // Token has not been used

  prisma.$transaction = async (fn) => {
    return fn({
      booking: {
        updateMany: async () => ({ count: 1 })
      },
      attendanceLog: {
        create: async ({ data }) => ({ id: 'log-1', ...data })
      },
      notification: {
        create: async () => ({ id: 'notif-1' })
      }
    });
  };

  try {
    const { req, res, getStatus, getJson, next } = createMockReqRes({
      user: { userId: 'passenger-1', role: 'USER' },
      body: {
        bookingId: 'booking-1',
        token: validToken,
        passengerLatitude: 37.4275,
        passengerLongitude: -122.1697,
        accuracyMeters: 10
      }
    });

    await verifyQr(req, res, next);
    assert.equal(getStatus(), 200);
    assert.equal(getJson().success, true);
    assert.match(getJson().message, /Boarding verified successfully/i);
    assert.equal(getJson().data.proximity.valid, true);
  } finally {
    prisma.booking.findUnique = origBookingFind;
    prisma.attendanceLog.findFirst = origLogFind;
    prisma.$transaction = origTransaction;
  }
});

test('E2. Authorization: Non-driver cannot start ride or issue QR tokens', async () => {
  const origRideFind = prisma.ride.findUnique;
  prisma.ride.findUnique = async () => ({
    id: 'ride-1',
    driverId: 'driver-real',
    status: 'SCHEDULED'
  });

  try {
    const { req, res, getStatus, getJson, next } = createMockReqRes({
      user: { userId: 'passenger-imposter', role: 'USER' },
      params: { rideId: 'ride-1' }
    });

    await initiateAttendance(req, res, next);
    assert.equal(getStatus(), 403);
    assert.match(getJson().message, /only the driver/i);

    const qrReqRes = createMockReqRes({
      user: { userId: 'passenger-imposter', role: 'USER' },
      params: { rideId: 'ride-1' }
    });
    await getRideQrToken(qrReqRes.req, qrReqRes.res, qrReqRes.next);
    assert.equal(qrReqRes.getStatus(), 403);
  } finally {
    prisma.ride.findUnique = origRideFind;
  }
});

test('E3. Authorization: Passenger cannot submit attendance on behalf of another passenger', async () => {
  const origBookingFind = prisma.booking.findUnique;
  prisma.booking.findUnique = async () => ({
    id: 'booking-1',
    passengerId: 'passenger-owner',
    status: 'ACCEPTED',
    ride: {
      id: 'ride-1',
      driverId: 'driver-1',
      status: 'ACTIVE',
      activeTotpSecret: 'secret-123'
    }
  });

  try {
    const { req, res, getStatus, getJson, next } = createMockReqRes({
      user: { userId: 'passenger-other', role: 'USER' },
      body: { bookingId: 'booking-1', token: 'dummy-token' }
    });

    await verifyQr(req, res, next);
    assert.equal(getStatus(), 403);
    assert.match(getJson().message, /only verify attendance for your own booking/i);
  } finally {
    prisma.booking.findUnique = origBookingFind;
  }
});

test('E4. Wrong Ride: Token for ride-A rejected for booking on ride-B', async () => {
  const secretA = generateTotpSecret();
  const tokenForRideA = generateSignedQrToken({ rideId: 'ride-A', type: 'DRIVER_BOARDING_QR' }, secretA, 60);

  const origBookingFind = prisma.booking.findUnique;
  prisma.booking.findUnique = async () => ({
    id: 'booking-B',
    passengerId: 'passenger-1',
    status: 'ACCEPTED',
    ride: {
      id: 'ride-B',
      driverId: 'driver-B',
      status: 'ACTIVE',
      activeTotpSecret: secretA // Same secret, but wrong ride claim
    }
  });

  try {
    const { req, res, getStatus, getJson, next } = createMockReqRes({
      user: { userId: 'passenger-1', role: 'USER' },
      body: { bookingId: 'booking-B', token: tokenForRideA }
    });

    await verifyQr(req, res, next);
    assert.equal(getStatus(), 400);
    assert.match(getJson().message, /QR token is not valid for this ride/i);
  } finally {
    prisma.booking.findUnique = origBookingFind;
  }
});

test('E5. Expired QR Token: Rejected with TOKEN_EXPIRED code', async () => {
  const secret = generateTotpSecret();
  const expiredToken = generateSignedQrToken({ rideId: 'ride-1' }, secret, -10);

  const origBookingFind = prisma.booking.findUnique;
  prisma.booking.findUnique = async () => ({
    id: 'booking-1',
    passengerId: 'passenger-1',
    status: 'ACCEPTED',
    ride: {
      id: 'ride-1',
      driverId: 'driver-1',
      status: 'ACTIVE',
      activeTotpSecret: secret
    }
  });

  try {
    const { req, res, getStatus, getJson, next } = createMockReqRes({
      user: { userId: 'passenger-1', role: 'USER' },
      body: { bookingId: 'booking-1', token: expiredToken }
    });

    await verifyQr(req, res, next);
    assert.equal(getStatus(), 400);
    assert.equal(getJson().code, 'TOKEN_EXPIRED');
  } finally {
    prisma.booking.findUnique = origBookingFind;
  }
});

test('E6. Replay Protection: Reused QR token is detected and rejected with 409', async () => {
  const secret = generateTotpSecret();
  const token = generateSignedQrToken({ rideId: 'ride-1' }, secret, 60);

  const origBookingFind = prisma.booking.findUnique;
  const origLogFind = prisma.attendanceLog.findFirst;

  prisma.booking.findUnique = async () => ({
    id: 'booking-1',
    passengerId: 'passenger-1',
    status: 'ACCEPTED',
    ride: {
      id: 'ride-1',
      driverId: 'driver-1',
      status: 'ACTIVE',
      activeTotpSecret: secret
    }
  });

  // Simulate token hash already recorded in database
  prisma.attendanceLog.findFirst = async () => ({
    id: 'prior-log',
    tokenHash: sha256(token)
  });

  try {
    const { req, res, getStatus, getJson, next } = createMockReqRes({
      user: { userId: 'passenger-1', role: 'USER' },
      body: { bookingId: 'booking-1', token }
    });

    await verifyQr(req, res, next);
    assert.equal(getStatus(), 409);
    assert.match(getJson().message, /already been used/i);
  } finally {
    prisma.booking.findUnique = origBookingFind;
    prisma.attendanceLog.findFirst = origLogFind;
  }
});

test('E7. Invalid State: Rejects boarding on cancelled ride or cancelled booking', async () => {
  const secret = generateTotpSecret();
  const token = generateSignedQrToken({ rideId: 'ride-1' }, secret, 60);
  const origBookingFind = prisma.booking.findUnique;

  // Case A: Booking is cancelled
  prisma.booking.findUnique = async () => ({
    id: 'booking-1',
    passengerId: 'passenger-1',
    status: 'CANCELLED_PASSENGER',
    ride: { id: 'ride-1', driverId: 'driver-1', status: 'ACTIVE', activeTotpSecret: secret }
  });

  try {
    const { req, res, getStatus, getJson, next } = createMockReqRes({
      user: { userId: 'passenger-1', role: 'USER' },
      body: { bookingId: 'booking-1', token }
    });
    await verifyQr(req, res, next);
    assert.equal(getStatus(), 400);
    assert.match(getJson().message, /CANCELLED_PASSENGER/i);
  } finally {
    prisma.booking.findUnique = origBookingFind;
  }

  // Case B: Ride is cancelled
  prisma.booking.findUnique = async () => ({
    id: 'booking-1',
    passengerId: 'passenger-1',
    status: 'ACCEPTED',
    ride: { id: 'ride-1', driverId: 'driver-1', status: 'CANCELLED', activeTotpSecret: secret }
  });

  try {
    const { req, res, getStatus, getJson, next } = createMockReqRes({
      user: { userId: 'passenger-1', role: 'USER' },
      body: { bookingId: 'booking-1', token }
    });
    await verifyQr(req, res, next);
    assert.equal(getStatus(), 400);
    assert.match(getJson().message, /cancelled ride/i);
  } finally {
    prisma.booking.findUnique = origBookingFind;
  }
});

test('E8. Destination Arrival: Validates passenger-specific drop location geofence', async () => {
  const origBookingFind = prisma.booking.findUnique;
  const origTransaction = prisma.$transaction;

  // Passenger drop is at (12.9716, 77.5946), while driver final destination is elsewhere (13.0827, 80.2707 Chennai)
  prisma.booking.findUnique = async () => ({
    id: 'booking-1',
    passengerId: 'passenger-1',
    status: 'BOARDED',
    dropAddress: 'MG Road, Bangalore',
    dropLatitude: 12.9716,
    dropLongitude: 77.5946,
    ride: {
      id: 'ride-1',
      driverId: 'driver-1',
      status: 'ACTIVE',
      destinationLatitude: 13.0827,
      destinationLongitude: 80.2707,
      geofenceRadiusMeters: 150
    }
  });

  prisma.$transaction = async (fn) => {
    return fn({
      booking: { updateMany: async () => ({ count: 1 }) },
      attendanceLog: { create: async ({ data }) => ({ id: 'log-arr', ...data }) },
      notification: { create: async () => ({ id: 'notif-arr' }) }
    });
  };

  try {
    // Passenger claims arrival at their drop location (12.9716, 77.5946) with 15m GPS accuracy
    const { req, res, getStatus, getJson, next } = createMockReqRes({
      user: { userId: 'passenger-1', role: 'USER' },
      body: {
        bookingId: 'booking-1',
        latitude: 12.9716,
        longitude: 77.5946,
        accuracy: 15
      }
    });

    await verifyArrival(req, res, next);
    assert.equal(getStatus(), 200);
    assert.equal(getJson().success, true);
    assert.match(getJson().message, /Destination arrival successfully verified/i);
    assert.equal(getJson().data.geofence.destinationAddress, 'MG Road, Bangalore');
  } finally {
    prisma.booking.findUnique = origBookingFind;
    prisma.$transaction = origTransaction;
  }
});

test('E9. Destination Arrival: Rejects arrival outside passenger drop geofence', async () => {
  const origBookingFind = prisma.booking.findUnique;

  prisma.booking.findUnique = async () => ({
    id: 'booking-1',
    passengerId: 'passenger-1',
    status: 'BOARDED',
    dropAddress: 'MG Road, Bangalore',
    dropLatitude: 12.9716,
    dropLongitude: 77.5946,
    ride: {
      id: 'ride-1',
      driverId: 'driver-1',
      destinationLatitude: 12.9716,
      destinationLongitude: 77.5946,
      geofenceRadiusMeters: 150
    }
  });

  try {
    // Reported coordinates 5 km away from passenger drop
    const { req, res, getStatus, getJson, next } = createMockReqRes({
      user: { userId: 'passenger-1', role: 'USER' },
      body: {
        bookingId: 'booking-1',
        latitude: 12.9200,
        longitude: 77.5946,
        accuracy: 10
      }
    });

    await verifyArrival(req, res, next);
    assert.equal(getStatus(), 400);
    assert.match(getJson().message, /away from your drop location/i);
  } finally {
    prisma.booking.findUnique = origBookingFind;
  }
});

test('E10. GPS Validation: Rejects invalid coordinates and inaccurate GPS (> 150m)', async () => {
  // Test invalid coordinates
  const req1 = createMockReqRes({
    user: { userId: 'p-1', role: 'USER' },
    body: { bookingId: 'b-1', latitude: 'not-a-number', longitude: 77.59 }
  });
  await verifyArrival(req1.req, req1.res, req1.next);
  assert.equal(req1.getStatus(), 400);
  assert.match(req1.getJson().message, /valid numbers/i);

  // Test out-of-range latitude (> 90)
  const req2 = createMockReqRes({
    user: { userId: 'p-1', role: 'USER' },
    body: { bookingId: 'b-1', latitude: 95.5, longitude: 77.59 }
  });
  await verifyArrival(req2.req, req2.res, req2.next);
  assert.equal(req2.getStatus(), 400);
  assert.match(req2.getJson().message, /between -90 and 90/i);

  // Test poor GPS accuracy (e.g. 250m accuracy > 150m threshold)
  const req3 = createMockReqRes({
    user: { userId: 'p-1', role: 'USER' },
    body: { bookingId: 'b-1', latitude: 12.9716, longitude: 77.5946, accuracy: 250 }
  });
  await verifyArrival(req3.req, req3.res, req3.next);
  assert.equal(req3.getStatus(), 400);
  assert.match(req3.getJson().message, /GPS accuracy is too poor/i);
});

test('E11. Duplicate Check-in & Arrival Protection: Rejects repeat submissions', async () => {
  const origBookingFind = prisma.booking.findUnique;

  // Booking already BOARDED
  prisma.booking.findUnique = async () => ({
    id: 'booking-1',
    passengerId: 'p-1',
    status: 'BOARDED',
    isAttended: true,
    ride: { id: 'r-1', driverId: 'd-1', activeTotpSecret: 'secret' }
  });

  try {
    const req1 = createMockReqRes({
      user: { userId: 'p-1', role: 'USER' },
      body: { bookingId: 'booking-1', token: 'token' }
    });
    await verifyQr(req1.req, req1.res, req1.next);
    assert.equal(req1.getStatus(), 400); // Already boarded
  } finally {
    prisma.booking.findUnique = origBookingFind;
  }

  // Booking already ARRIVED
  prisma.booking.findUnique = async () => ({
    id: 'booking-1',
    passengerId: 'p-1',
    status: 'ARRIVED',
    ride: { id: 'r-1', driverId: 'd-1' }
  });

  try {
    const req2 = createMockReqRes({
      user: { userId: 'p-1', role: 'USER' },
      body: { bookingId: 'booking-1', latitude: 12.97, longitude: 77.59, accuracy: 10 }
    });
    await verifyArrival(req2.req, req2.res, req2.next);
    assert.equal(req2.getStatus(), 409); // Already arrived
    assert.match(req2.getJson().message, /Arrival has already been verified/i);
  } finally {
    prisma.booking.findUnique = origBookingFind;
  }
});

test('E12. Concurrency Race Condition: Atomically handles simultaneous duplicate requests', async () => {
  const secret = generateTotpSecret();
  const token = generateSignedQrToken({ rideId: 'ride-1' }, secret, 60);

  const origBookingFind = prisma.booking.findUnique;
  const origLogFind = prisma.attendanceLog.findFirst;
  const origTransaction = prisma.$transaction;

  prisma.booking.findUnique = async () => ({
    id: 'booking-1',
    passengerId: 'p-1',
    status: 'ACCEPTED',
    isAttended: false,
    ride: { id: 'ride-1', driverId: 'd-1', status: 'ACTIVE', activeTotpSecret: secret }
  });

  prisma.attendanceLog.findFirst = async () => null;

  // Simulate database collision: updateMany affects 0 rows because another worker already updated it!
  prisma.$transaction = async (fn) => {
    return fn({
      booking: { updateMany: async () => ({ count: 0 }) }
    });
  };

  try {
    const { req, res, getStatus, getJson, next } = createMockReqRes({
      user: { userId: 'p-1', role: 'USER' },
      body: { bookingId: 'booking-1', token }
    });

    await verifyQr(req, res, next);
    assert.equal(getStatus(), 409); // Returns 409 Conflict rather than 500 error
    assert.match(getJson().message, /already recorded/i);
  } finally {
    prisma.booking.findUnique = origBookingFind;
    prisma.attendanceLog.findFirst = origLogFind;
    prisma.$transaction = origTransaction;
  }
});

test('E13. Database Failure Handling: Unexpected errors forwarded to error handler', async () => {
  const origBookingFind = prisma.booking.findUnique;
  prisma.booking.findUnique = async () => {
    throw new Error('DATABASE_CONNECTION_LOST');
  };

  try {
    const { req, res, getError, next } = createMockReqRes({
      user: { userId: 'p-1', role: 'USER' },
      body: { bookingId: 'b-1', token: 'token' }
    });

    await verifyQr(req, res, next);
    assert.ok(getError(), 'Error must be passed to next(err)');
    assert.equal(getError().message, 'DATABASE_CONNECTION_LOST');
  } finally {
    prisma.booking.findUnique = origBookingFind;
  }
});
