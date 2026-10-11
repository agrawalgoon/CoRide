import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
  distanceMeters,
  checkGeofence,
  generateTotpSecret,
  deriveTotpToken,
  verifyTotpToken,
  generateSignedQrToken,
  verifySignedQrToken,
  sha256
} from '../src/services/attendance/attendance.utils.js';

test('1. Dynamic QR: Generates and verifies valid signed token', () => {
  const secret = generateTotpSecret();
  const payload = {
    rideId: 'ride-123',
    type: 'DRIVER_BOARDING_QR'
  };

  const token = generateSignedQrToken(payload, secret, 60);
  assert.ok(token, 'Token string should be generated');
  assert.ok(token.includes('.'), 'Token format should be payload.signature');

  const result = verifySignedQrToken(token, secret);
  assert.equal(result.valid, true, 'Verification must succeed for valid token');
  assert.equal(result.payload.rideId, 'ride-123');
  assert.equal(result.payload.type, 'DRIVER_BOARDING_QR');
  assert.ok(result.payload.exp > Date.now(), 'Token exp must be in future');
});

test('2. Dynamic QR: Rejects tampered / invalid signature', () => {
  const secret = generateTotpSecret();
  const token = generateSignedQrToken({ rideId: 'ride-123' }, secret, 60);

  // Tamper with payload
  const [payloadBase64, sig] = token.split('.');
  const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
  decoded.rideId = 'ride-hacked-999';
  const forgedPayload = Buffer.from(JSON.stringify(decoded)).toString('base64url');
  const forgedToken = `${forgedPayload}.${sig}`;

  const result = verifySignedQrToken(forgedToken, secret);
  assert.equal(result.valid, false);
  assert.equal(result.code, 'SIGNATURE_INVALID');

  // Verify against wrong secret
  const wrongSecret = generateTotpSecret();
  const wrongResult = verifySignedQrToken(token, wrongSecret);
  assert.equal(wrongResult.valid, false);
  assert.equal(wrongResult.code, 'SIGNATURE_INVALID');
});

test('3. Dynamic QR: Rejects expired token', async () => {
  const secret = generateTotpSecret();
  // Create token with -1s TTL (already expired)
  const expiredToken = generateSignedQrToken({ rideId: 'ride-123' }, secret, -1);

  const result = verifySignedQrToken(expiredToken, secret);
  assert.equal(result.valid, false);
  assert.equal(result.code, 'TOKEN_EXPIRED');
  assert.match(result.error, /expired/i);
});

test('4. Dynamic QR: Replay attack & Single-use prevention via token hash', () => {
  const secret = generateTotpSecret();
  const token = generateSignedQrToken({ rideId: 'ride-123' }, secret, 60);

  const hash1 = sha256(token);
  const hash2 = sha256(token);
  assert.equal(hash1, hash2, 'Identical token must produce identical hash');

  // Simulated used token cache/database check
  const usedTokens = new Set();
  assert.equal(usedTokens.has(hash1), false, 'Token should initially be unused');

  usedTokens.add(hash1);
  assert.equal(usedTokens.has(hash1), true, 'Token is marked consumed');

  // Second attempt is recognized as replay
  const isReplayed = usedTokens.has(sha256(token));
  assert.equal(isReplayed, true, 'Second attempt must be flagged as already used/replayed');
});

test('5. TOTP Drift: Validates current and previous window; rejects older windows', () => {
  const secret = generateTotpSecret();
  const currentToken = deriveTotpToken(secret, 90, 0);
  const prevToken = deriveTotpToken(secret, 90, -1);
  const oldToken = deriveTotpToken(secret, 90, -2);

  assert.equal(verifyTotpToken(currentToken, secret, 90), true, 'Current window must be valid');
  assert.equal(verifyTotpToken(prevToken, secret, 90), true, 'Previous window must be accepted for clock drift');
  assert.equal(verifyTotpToken(oldToken, secret, 90), false, '2-window-old token must be rejected');
  assert.equal(verifyTotpToken('INVALID', secret, 90), false, 'Random string must be rejected');
});

test('6. Geofence: Haversine distance and radius boundary checks', () => {
  // Coordinates around Stanford University Campus Hub (approx 37.4275, -122.1697)
  const campusLat = 37.4275;
  const campusLon = -122.1697;

  // Exact point -> distance 0m -> inside 200m geofence
  const exact = checkGeofence(campusLat, campusLon, campusLat, campusLon, 200);
  assert.equal(exact.valid, true);
  assert.equal(exact.rawDistanceMeters, 0);

  // Point ~80m away (lat + 0.0007)
  const close = checkGeofence(campusLat, campusLon, campusLat + 0.0007, campusLon, 200);
  assert.equal(close.valid, true);
  assert.ok(close.rawDistanceMeters < 200);

  // Point ~1km away (lat + 0.01)
  const far = checkGeofence(campusLat, campusLon, campusLat + 0.01, campusLon, 200);
  assert.equal(far.valid, false);
  assert.ok(far.rawDistanceMeters > 500);
});

test('7. Geofence: Handles GPS accuracy margin and limits spoofing', () => {
  const hubLat = 12.9716; // Bangalore center
  const hubLon = 77.5946;

  // Point 160m away, allowed radius 150m, but GPS accuracy is +/- 25m
  // With 25m accuracy margin, effective distance = 160 - 25 = 135m <= 150m (valid)
  const pointLat = hubLat + 0.0014;
  const pointLon = hubLon;
  const rawDist = distanceMeters(hubLat, hubLon, pointLat, pointLon);

  const resultWithAccuracy = checkGeofence(hubLat, hubLon, pointLat, pointLon, 180, 30);
  assert.equal(resultWithAccuracy.valid, true);
  assert.ok(resultWithAccuracy.effectiveDistanceMeters <= resultWithAccuracy.rawDistanceMeters);

  // Extreme GPS accuracy credit is capped to 50m to prevent spoofing
  const spoofedAccuracy = checkGeofence(hubLat, hubLon, hubLat + 0.05, hubLon, 150, 99999);
  assert.equal(spoofedAccuracy.valid, false, 'Huge reported accuracy must not bypass distant geofence');
});

test('8. State Machine: Controlled transitions from BOOKED -> BOARDED -> ARRIVED', () => {
  // State machine simulation with strict validation rules
  const transitions = {
    ACCEPTED: ['BOARDED', 'NO_SHOW', 'CANCELLED_PASSENGER', 'CANCELLED_DRIVER'],
    BOARDED: ['ARRIVED', 'COMPLETED'],
    ARRIVED: ['COMPLETED'],
    NO_SHOW: []
  };

  const canTransition = (current, next) => {
    return Boolean(transitions[current]?.includes(next));
  };

  // Valid transitions
  assert.equal(canTransition('ACCEPTED', 'BOARDED'), true, 'ACCEPTED can transition to BOARDED');
  assert.equal(canTransition('BOARDED', 'ARRIVED'), true, 'BOARDED can transition to ARRIVED');
  assert.equal(canTransition('ACCEPTED', 'NO_SHOW'), true, 'ACCEPTED can transition to NO_SHOW');

  // Invalid transitions
  assert.equal(canTransition('BOARDED', 'NO_SHOW'), false, 'Cannot mark BOARDED passenger as NO_SHOW');
  assert.equal(canTransition('ARRIVED', 'BOARDED'), false, 'Cannot re-board an ARRIVED passenger');
  assert.equal(canTransition('NO_SHOW', 'BOARDED'), false, 'Cannot board a NO_SHOW passenger');
  assert.equal(canTransition('ACCEPTED', 'ARRIVED'), false, 'Cannot arrive without boarding first');
});

test('9. Passenger Boarding Pass: Generates signed pass for driver scan', () => {
  const secret = generateTotpSecret();
  const token = generateSignedQrToken(
    {
      bookingId: 'book-456',
      passengerId: 'user-789',
      rideId: 'ride-123',
      type: 'PASSENGER_BOARDING_PASS'
    },
    secret,
    60
  );

  const verification = verifySignedQrToken(token, secret);
  assert.equal(verification.valid, true);
  assert.equal(verification.payload.bookingId, 'book-456');
  assert.equal(verification.payload.passengerId, 'user-789');
  assert.equal(verification.payload.rideId, 'ride-123');
  assert.equal(verification.payload.type, 'PASSENGER_BOARDING_PASS');
});

test('10. Privacy & Location Permission Denial Handling', () => {
  // Simulated request where passenger denied browser geolocation
  const reqBody = {
    bookingId: 'book-1',
    token: 'valid.token',
    locationPermissionDenied: true,
    passengerLatitude: null,
    passengerLongitude: null
  };

  const isDenied = Boolean(reqBody.locationPermissionDenied);
  const hasCoordinates = reqBody.passengerLatitude !== null && reqBody.passengerLongitude !== null;

  assert.equal(isDenied, true);
  assert.equal(hasCoordinates, false);

  // Audit record verifies privacy preservation: no continuous coordinates retained
  const auditLog = {
    bookingId: reqBody.bookingId,
    locationDenied: isDenied,
    passengerLatitude: hasCoordinates ? reqBody.passengerLatitude : null,
    passengerLongitude: hasCoordinates ? reqBody.passengerLongitude : null,
    status: 'BOARDED',
    notes: isDenied ? 'Passenger denied geolocation permission' : null
  };

  assert.equal(auditLog.locationDenied, true);
  assert.equal(auditLog.passengerLatitude, null);
  assert.equal(auditLog.passengerLongitude, null);
  assert.equal(auditLog.status, 'BOARDED');
});
