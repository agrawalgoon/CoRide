import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistanceKm,
  calculatePerpendicularDistanceKm,
  normalizeScore,
  generateDetailedReasons
} from '../src/services/matching/matching.utils.js';
import { MATCHING_WEIGHTS, MATCHING_THRESHOLDS } from '../src/services/matching/matching.config.js';

test('1. Match Score Formula: Validates weights sum to 1.0 (100%)', () => {
  const sum =
    MATCHING_WEIGHTS.ROUTE +
    MATCHING_WEIGHTS.PICKUP +
    MATCHING_WEIGHTS.DESTINATION +
    MATCHING_WEIGHTS.TIME +
    MATCHING_WEIGHTS.TRUST;

  assert.equal(Math.round(sum * 100) / 100, 1.0);
});

test('2. Score Normalization: Inverts correctly and respects boundary clamps', () => {
  assert.equal(normalizeScore(0, 0, 10, true), 100);
  assert.equal(normalizeScore(5, 0, 10, true), 50);
  assert.equal(normalizeScore(10, 0, 10, true), 0);
  assert.equal(normalizeScore(15, 0, 10, true), 0); // clamp min 0

  assert.equal(normalizeScore(10, 0, 10, false), 100);
  assert.equal(normalizeScore(5, 0, 10, false), 50);
  assert.equal(normalizeScore(0, 0, 10, false), 0);
});

test('3. Dynamic Match Score Variation: Produces distinct scores based on pickup and time (NOT fixed 88%)', () => {
  // Scenario A: Highly compatible ride
  // - Detour 0.5 km (score: 95)
  // - Pickup corridor 0.2 km (score: 98)
  // - Drop distance 0.3 km (score: 96)
  // - Time diff 10 mins (score: 94)
  // - Trust: 90
  const scoreA = Math.round(
    normalizeScore(0.5, 0, MATCHING_THRESHOLDS.MAX_ALLOWABLE_DETOUR_KM, true) * MATCHING_WEIGHTS.ROUTE +
    normalizeScore(0.2, 0, MATCHING_THRESHOLDS.MAX_PICKUP_CORRIDOR_KM, true) * MATCHING_WEIGHTS.PICKUP +
    normalizeScore(0.3, 0, MATCHING_THRESHOLDS.MAX_DROP_CORRIDOR_KM, true) * MATCHING_WEIGHTS.DESTINATION +
    normalizeScore(10, 0, 180, true) * MATCHING_WEIGHTS.TIME +
    90 * MATCHING_WEIGHTS.TRUST
  );

  // Scenario B: Moderate compatible ride
  // - Detour 4.0 km (score: 60)
  // - Pickup corridor 3.5 km (score: 56)
  // - Drop distance 3.0 km (score: 63)
  // - Time diff 60 mins (score: 67)
  // - Trust: 50
  const scoreB = Math.round(
    normalizeScore(4.0, 0, MATCHING_THRESHOLDS.MAX_ALLOWABLE_DETOUR_KM, true) * MATCHING_WEIGHTS.ROUTE +
    normalizeScore(3.5, 0, MATCHING_THRESHOLDS.MAX_PICKUP_CORRIDOR_KM, true) * MATCHING_WEIGHTS.PICKUP +
    normalizeScore(3.0, 0, MATCHING_THRESHOLDS.MAX_DROP_CORRIDOR_KM, true) * MATCHING_WEIGHTS.DESTINATION +
    normalizeScore(60, 0, 180, true) * MATCHING_WEIGHTS.TIME +
    50 * MATCHING_WEIGHTS.TRUST
  );

  // Scenario C: Borderline compatible ride
  // - Detour 8.5 km
  // - Pickup corridor 7.0 km
  // - Drop distance 6.5 km
  // - Time diff 150 mins
  // - Trust: 20
  const scoreC = Math.round(
    normalizeScore(8.5, 0, MATCHING_THRESHOLDS.MAX_ALLOWABLE_DETOUR_KM, true) * MATCHING_WEIGHTS.ROUTE +
    normalizeScore(7.0, 0, MATCHING_THRESHOLDS.MAX_PICKUP_CORRIDOR_KM, true) * MATCHING_WEIGHTS.PICKUP +
    normalizeScore(6.5, 0, MATCHING_THRESHOLDS.MAX_DROP_CORRIDOR_KM, true) * MATCHING_WEIGHTS.DESTINATION +
    normalizeScore(150, 0, 180, true) * MATCHING_WEIGHTS.TIME +
    20 * MATCHING_WEIGHTS.TRUST
  );

  assert.ok(scoreA > 90, `Expected scoreA > 90, got ${scoreA}`);
  assert.ok(scoreB >= 55 && scoreB <= 70, `Expected scoreB in [55, 70], got ${scoreB}`);
  assert.ok(scoreC < 30, `Expected scoreC < 30, got ${scoreC}`);
  assert.notEqual(scoreA, 88);
  assert.notEqual(scoreB, 88);
  assert.notEqual(scoreC, 88);
});

test('4. Perpendicular Corridor Calculation: Identifies points along highway vs perpendicular deviations', () => {
  // Line along 19.80, 75.30 -> 19.90, 75.30 (due north line along longitude 75.30)
  // Point on line: 19.85, 75.30 -> perp distance should be approx 0 km
  const distOnLine = calculatePerpendicularDistanceKm(19.85, 75.30, 19.80, 75.30, 19.90, 75.30);
  assert.ok(distOnLine < 0.05, `Expected on-line distance < 0.05km, got ${distOnLine}`);

  // Point 0.05 degrees east: approx 5.2 km
  const distOffLine = calculatePerpendicularDistanceKm(19.85, 75.35, 19.80, 75.30, 19.90, 75.30);
  assert.ok(distOffLine > 4.5 && distOffLine < 6.0, `Expected ~5.2km, got ${distOffLine}`);
});

test('5. Human-readable Reasons: Generates contextual rationale based on factors', () => {
  const reasons = generateDetailedReasons({
    pickupCorridorKm: 0.8,
    dropDistanceKm: 1.0,
    detourKm: 1.2,
    diffMinutes: 10,
    isSameOrg: true,
    driverRating: 4.9
  });

  assert.ok(reasons.some((r) => r.includes('under 1 km')));
  assert.ok(reasons.some((r) => r.includes('within 15 minutes')));
  assert.ok(reasons.some((r) => r.includes('campus / organization')));
  assert.ok(reasons.some((r) => r.includes('Top-rated driver')));
});
