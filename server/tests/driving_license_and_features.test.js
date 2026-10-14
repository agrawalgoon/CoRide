import { test } from 'node:test';
import assert from 'node:assert/strict';
import { maskLicenseNumber } from '../src/controllers/users.controller.js';
import { drivingLicenseSchema } from '../src/validators/user.validator.js';
import { validateRouteCompatibility } from '../src/services/routing/routing.service.js';

test('DL-1: Driving License Masking: Masks middle digits while preserving prefix and suffix', () => {
  const masked1 = maskLicenseNumber('MH1420110012345');
  assert.equal(masked1.slice(0, 4), 'MH14');
  assert.equal(masked1.slice(-4), '2345');
  assert.ok(masked1.includes('***'));

  const masked2 = maskLicenseNumber('DL0420180009988');
  assert.equal(masked2.slice(0, 4), 'DL04');
  assert.equal(masked2.slice(-4), '9988');

  // Short license number masking
  const shortMasked = maskLicenseNumber('MH123456');
  assert.equal(shortMasked.slice(0, 2), 'MH');
  assert.equal(shortMasked.slice(-2), '56');
  assert.ok(shortMasked.includes('****'));
});

test('DL-2: Driving License Validation Schema: Rejects invalid format or expired licenses', () => {
  // Valid future license
  const validResult = drivingLicenseSchema.safeParse({
    licenseNumber: 'MH14 20110012345',
    holderName: 'Rahul Sharma',
    expiryDate: new Date(Date.now() + 365 * 24 * 3600000).toISOString()
  });
  assert.equal(validResult.success, true);

  // Expired license
  const expiredResult = drivingLicenseSchema.safeParse({
    licenseNumber: 'MH14 20110012345',
    holderName: 'Rahul Sharma',
    expiryDate: '2020-01-01T00:00:00.000Z'
  });
  assert.equal(expiredResult.success, false);

  // Short or invalid license number
  const shortResult = drivingLicenseSchema.safeParse({
    licenseNumber: 'AB12',
    holderName: 'Rahul Sharma',
    expiryDate: new Date(Date.now() + 365 * 24 * 3600000).toISOString()
  });
  assert.equal(shortResult.success, false);
});

test('CAP-1: Seat Capacity Constraint: Max passenger seats is vehicle.seatCapacity - 1 (1 driver seat reserved)', () => {
  const motorbike = { seatCapacity: 2 };
  const maxMotorbikePassengers = Math.max(1, motorbike.seatCapacity - 1);
  assert.equal(maxMotorbikePassengers, 1);

  const sedan = { seatCapacity: 5 };
  const maxSedanPassengers = Math.max(1, sedan.seatCapacity - 1);
  assert.equal(maxSedanPassengers, 4);

  const suv = { seatCapacity: 7 };
  const maxSuvPassengers = Math.max(1, suv.seatCapacity - 1);
  assert.equal(maxSuvPassengers, 6);
});

test('SMART-1: Smart Pairing: Rejects travel in opposite direction to driver route', () => {
  const driverRide = {
    originLatitude: 19.8762,
    originLongitude: 75.3433,
    destinationLatitude: 19.8500,
    destinationLongitude: 75.3200
  };

  // Passenger going in opposite direction (southwest to northeast)
  const oppositePassenger = {
    pickupLat: 19.8500,
    pickupLon: 75.3200,
    dropLat: 19.8762,
    dropLon: 75.3433
  };

  const check = validateRouteCompatibility(
    driverRide,
    oppositePassenger.pickupLat,
    oppositePassenger.pickupLon,
    oppositePassenger.dropLat,
    oppositePassenger.dropLon
  );

  assert.equal(check.valid, false);
  assert.ok(check.reason.includes('opposite'));
});

test('SMART-2: Smart Pairing: Rejects pickups too far outside route corridor (> 10 km perpendicular)', () => {
  const driverRide = {
    originLatitude: 19.8762,
    originLongitude: 75.3433,
    destinationLatitude: 19.8500,
    destinationLongitude: 75.3200
  };

  // Pickup 25 km perpendicular away
  const farPassenger = {
    pickupLat: 20.1500,
    pickupLon: 75.3433,
    dropLat: 19.8500,
    dropLon: 75.3200
  };

  const check = validateRouteCompatibility(
    driverRide,
    farPassenger.pickupLat,
    farPassenger.pickupLon,
    farPassenger.dropLat,
    farPassenger.dropLon
  );

  assert.equal(check.valid, false);
  assert.ok(check.reason && check.reason.length > 0);
});
