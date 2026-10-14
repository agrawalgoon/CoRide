// ============================================================
// Matching Mathematical & Geographic Utility Functions
// ============================================================

const EARTH_RADIUS_KM = 6371;

/**
 * Geometric Haversine distance in kilometers.
 * Used for preliminary corridor projections and geofence radius checks.
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

/**
 * Calculate perpendicular distance from a coordinate point to a line segment (km).
 * Uses cross-track projection.
 */
export const calculatePerpendicularDistanceKm = (
  pointLat,
  pointLon,
  lineStartLat,
  lineStartLon,
  lineEndLat,
  lineEndLon
) => {
  const dLat = lineEndLat - lineStartLat;
  const dLon = lineEndLon - lineStartLon;
  const lineLenSq = dLat * dLat + dLon * dLon;

  if (lineLenSq === 0) {
    return calculateDistanceKm(pointLat, pointLon, lineStartLat, lineStartLon);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((pointLat - lineStartLat) * dLat + (pointLon - lineStartLon) * dLon) / lineLenSq
    )
  );

  const closestLat = lineStartLat + t * dLat;
  const closestLon = lineStartLon + t * dLon;

  return calculateDistanceKm(pointLat, pointLon, closestLat, closestLon);
};

/**
 * Normalize a numeric value into a 0 - 100 percentage score.
 */
export const normalizeScore = (value, min, max, inverse = false) => {
  if (min === max) return 100;
  let score = 0;
  if (value <= min) {
    score = inverse ? 100 : 0;
  } else if (value >= max) {
    score = inverse ? 0 : 100;
  } else {
    const ratio = (value - min) / (max - min);
    score = inverse ? (1 - ratio) * 100 : ratio * 100;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Generate human-readable reasons explaining the compatibility score.
 */
export const generateDetailedReasons = ({
  pickupCorridorKm,
  dropDistanceKm,
  detourKm,
  diffMinutes,
  isSameOrg,
  driverRating
}) => {
  const reasons = [];

  if (pickupCorridorKm < 1.0) {
    reasons.push('Driver passes right by your pickup point (under 1 km)');
  } else if (pickupCorridorKm < 3.0) {
    reasons.push(`Pickup is convenient (${pickupCorridorKm.toFixed(1)} km from driver's route)`);
  } else {
    reasons.push(`Pickup requires minor stop (${pickupCorridorKm.toFixed(1)} km from route)`);
  }

  if (dropDistanceKm < 1.5) {
    reasons.push('Common destination hub: within walking distance of your drop-off');
  } else if (dropDistanceKm < 4.0) {
    reasons.push(`Drop-off is close to driver destination (${dropDistanceKm.toFixed(1)} km)`);
  }

  if (detourKm != null && detourKm < 2.0) {
    reasons.push('Minimal road detour for driver (under 2 km)');
  } else if (detourKm != null && detourKm < 5.0) {
    reasons.push(`Reasonable road detour (${detourKm.toFixed(1)} km extra road travel)`);
  }

  if (diffMinutes <= 15) {
    reasons.push('Ideal departure time (within 15 minutes of your target)');
  } else if (diffMinutes <= 45) {
    reasons.push(`Close departure schedule (within ${diffMinutes} minutes)`);
  }

  if (isSameOrg) {
    reasons.push('Verified member of your campus / organization');
  }

  if (driverRating >= 4.7) {
    reasons.push(`Top-rated driver (${Number(driverRating).toFixed(1)} ★)`);
  }

  return reasons;
};
