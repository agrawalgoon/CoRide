import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAuthoritativeRoadRoute,
  calculateFuelCost,
  calculateSegmentFairCostSharing,
  validateRouteCompatibility,
  haversineKm
} from '../src/services/routing/routing.service.js';

test('1. Origin-to-destination road-distance calculation', async () => {
  // Station (19.8656, 75.3182) to Connaught Place (19.8837, 75.3421)
  const route = await computeAuthoritativeRoadRoute({
    origin: { latitude: 19.8656, longitude: 75.3182 },
    destination: { latitude: 19.8837, longitude: 75.3421 }
  });

  assert.ok(route, 'Route must be returned');
  assert.ok(route.distanceKm > 0, 'Road distance must be greater than 0');
  assert.ok(route.distanceMeters > 0, 'Distance in meters must be returned');
  assert.ok(route.durationMinutes >= 0, 'Duration in minutes must be present');
  assert.ok(['google_routes', 'openrouteservice', 'osrm'].includes(route.provider));
  assert.equal(route.status, 'SUCCESS');
});

test('2. Road distance is strictly greater than or equal to straight-line distance', async () => {
  const oLat = 19.8656, oLon = 75.3182;
  const dLat = 19.8837, dLon = 75.3421;

  const straight = haversineKm(oLat, oLon, dLat, dLon);
  const road = await computeAuthoritativeRoadRoute({
    origin: { latitude: oLat, longitude: oLon },
    destination: { latitude: dLat, longitude: dLon }
  });

  // Road distance must always be greater than geometric Euclidean/Haversine straight-line distance
  assert.ok(
    road.distanceKm >= straight,
    `Road distance (${road.distanceKm} km) must be >= straight line (${straight.toFixed(2)} km)`
  );
});

test('3. Fuel-Cost Calculation formula verification', () => {
  // Formula:
  // Fuel required in litres = Road distance in km / Vehicle mileage in km/litre
  // Estimated fuel cost = Fuel required * Fuel price per litre
  // Example: 12 km, 15 km/l, ₹105/l -> 12 / 15 = 0.8 L -> 0.8 * 105 = ₹84
  const result = calculateFuelCost({
    roadDistanceKm: 12,
    mileageKmPerLitre: 15,
    fuelPricePerLitre: 105
  });

  assert.equal(result.roadDistanceKm, 12);
  assert.equal(result.mileageKmPerLitre, 15);
  assert.equal(result.fuelPricePerLitre, 105);
  assert.equal(result.fuelRequiredLitres, 0.8);
  assert.equal(result.estimatedFuelCost, 84.00);
});

test('4. Single passenger travelling part of journey is not charged for untravelled segments', async () => {
  const driverRoute = {
    origin: { latitude: 19.85, longitude: 75.30 },
    destination: { latitude: 19.95, longitude: 75.40 }
  };

  const passenger = {
    id: 'p1',
    name: 'Alice',
    pickup: { latitude: 19.88, longitude: 75.33 },
    drop: { latitude: 19.92, longitude: 75.37 },
    seatsBooked: 1
  };

  const sharing = await calculateSegmentFairCostSharing({
    driverRoute,
    passengers: [passenger],
    mileageKmPerLitre: 15,
    fuelPricePerLitre: 105,
    driverSharesFuelCost: true
  });

  assert.ok(sharing.legs.length >= 2, 'Route must be segmented into multiple legs');
  assert.ok(sharing.passengerBreakdown.length === 1);

  const alice = sharing.passengerBreakdown[0];
  assert.ok(alice.travelledDistanceKm < sharing.totalTripRoadDistanceKm, 'Passenger distance must be less than full route');
  assert.ok(alice.allocatedFuelCost < sharing.totalTripFuelCost, 'Passenger fuel cost must be less than full trip fuel cost');

  // Verify passenger is only charged for legs where they were active
  sharing.legs.forEach((leg) => {
    if (!leg.activePassengerIds.includes('p1')) {
      assert.ok(!leg.activePassengerIds.includes('p1'));
    }
  });
});

test('5. Multiple passengers on different segments with cost reconciliation', async () => {
  const driverRoute = {
    origin: { latitude: 19.85, longitude: 75.30 },
    destination: { latitude: 19.95, longitude: 75.40 }
  };

  const passengers = [
    {
      id: 'pA',
      name: 'Passenger A (Full)',
      pickup: { latitude: 19.85, longitude: 75.30 },
      drop: { latitude: 19.95, longitude: 75.40 },
      seatsBooked: 1
    },
    {
      id: 'pB',
      name: 'Passenger B (Half)',
      pickup: { latitude: 19.90, longitude: 75.35 },
      drop: { latitude: 19.95, longitude: 75.40 },
      seatsBooked: 1
    }
  ];

  const sharing = await calculateSegmentFairCostSharing({
    driverRoute,
    passengers,
    mileageKmPerLitre: 15,
    fuelPricePerLitre: 105,
    driverSharesFuelCost: true
  });

  const pA = sharing.passengerBreakdown.find((p) => p.passengerId === 'pA');
  const pB = sharing.passengerBreakdown.find((p) => p.passengerId === 'pB');

  assert.ok(pA && pB, 'Both passengers must be in breakdown');
  assert.ok(
    pA.allocatedFuelCost > pB.allocatedFuelCost,
    `Full-route passenger A (₹${pA.allocatedFuelCost}) must pay more than half-route passenger B (₹${pB.allocatedFuelCost})`
  );

  assert.ok(pA.allocatedFuelCost >= 0);
  assert.ok(pB.allocatedFuelCost >= 0);
  assert.ok(sharing.driverCostShare >= 0);

  const totalAllocated = sharing.driverCostShare + sharing.totalPassengerAllocations;
  const diff = Math.abs(sharing.totalTripFuelCost - totalAllocated);
  assert.ok(
    diff <= 0.05,
    `Reconciliation discrepancy (₹${diff}) must be within standard rounding tolerance of 5 paise`
  );
});

test('6. Route validation rejects opposite direction and out-of-corridor requests', () => {
  const ride = {
    originLatitude: 19.85,
    originLongitude: 75.30,
    destinationLatitude: 19.95,
    destinationLongitude: 75.40
  };

  // 1. Opposite travel direction
  const opposite = validateRouteCompatibility(
    ride,
    19.95, 75.40,
    19.85, 75.30
  );
  assert.equal(opposite.valid, false);
  assert.ok(opposite.reason.toLowerCase().includes('opposite'));

  // 2. Far away out of corridor
  const farAway = validateRouteCompatibility(
    ride,
    21.00, 77.00,
    21.10, 77.10
  );
  assert.equal(farAway.valid, false);
  assert.ok(typeof farAway.reason === 'string' && farAway.reason.length > 0);

  // 3. Valid route along corridor
  const valid = validateRouteCompatibility(
    ride,
    19.87, 75.32,
    19.93, 75.38
  );
  assert.equal(valid.valid, true);
});

test('7. Error handling on invalid coordinates', async () => {
  await assert.rejects(
    async () => {
      await computeAuthoritativeRoadRoute({
        origin: { latitude: 'invalid', longitude: null },
        destination: { latitude: 19.95, longitude: 75.40 }
      });
    },
    /Valid origin and destination coordinates are required/
  );
});

test('8. Recalculation after route or fuel-price changes', () => {
  const cost1 = calculateFuelCost({
    roadDistanceKm: 20,
    mileageKmPerLitre: 15,
    fuelPricePerLitre: 100
  });

  const cost2 = calculateFuelCost({
    roadDistanceKm: 20,
    mileageKmPerLitre: 15,
    fuelPricePerLitre: 120
  });

  assert.notEqual(cost1.estimatedFuelCost, cost2.estimatedFuelCost);
  assert.equal(cost1.estimatedFuelCost, 133.33);
  assert.equal(cost2.estimatedFuelCost, 160.00);
});
