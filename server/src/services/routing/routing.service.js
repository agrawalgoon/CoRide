// ============================================================
// Routing & Fare Calculation Service for CoRide
// ============================================================
// Uses OSRM public demo for driving distance (no paid API).
// Fallback: Haversine × 1.3 empirical winding factor.
// ============================================================

const EARTH_RADIUS_KM = 6371;
const ROAD_WINDING_FACTOR = 1.3;
const OSRM_TIMEOUT_MS = 4000;
const MIN_FARE = 10; // ₹ minimum per-seat fare
const MAX_CORRIDOR_KM = 10; // max perpendicular distance from driver route

// ----------------------------------------------------------
// Haversine distance (km) — for proximity checks only
// ----------------------------------------------------------

export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ----------------------------------------------------------
// Get driving distance (km) between two points
// Primary: OSRM demo server
// Fallback: haversine × 1.3
// ----------------------------------------------------------

export async function getDrivingDistanceKm(lat1, lon1, lat2, lon2) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${lon1},${lat1};${lon2},${lat2}?overview=false`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CoRide-CarpoolApp/1.0 (academic-project)'
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`OSRM HTTP ${response.status}`);
    }

    const data = await response.json();

    if (
      data.code === 'Ok' &&
      data.routes &&
      data.routes.length > 0 &&
      data.routes[0].distance > 0
    ) {
      return {
        distanceKm: Number((data.routes[0].distance / 1000).toFixed(2)),
        source: 'osrm'
      };
    }

    throw new Error('OSRM returned no valid route');
  } catch {
    // Fallback: Haversine with empirical road winding factor
    const straight = haversineKm(lat1, lon1, lat2, lon2);
    return {
      distanceKm: Number((straight * ROAD_WINDING_FACTOR).toFixed(2)),
      source: 'estimate'
    };
  }
}

// ----------------------------------------------------------
// Perpendicular distance from point to line segment (km)
// Uses Haversine-based cross-track distance approximation
// ----------------------------------------------------------

function perpendicularDistanceKm(
  pointLat, pointLon,
  lineStartLat, lineStartLon,
  lineEndLat, lineEndLon
) {
  // Vector from line start to line end
  const dLat = lineEndLat - lineStartLat;
  const dLon = lineEndLon - lineStartLon;
  const lineLenSq = dLat * dLat + dLon * dLon;

  if (lineLenSq === 0) {
    return haversineKm(pointLat, pointLon, lineStartLat, lineStartLon);
  }

  // Project point onto line (parametric t)
  const t = Math.max(0, Math.min(1,
    ((pointLat - lineStartLat) * dLat + (pointLon - lineStartLon) * dLon) / lineLenSq
  ));

  // Closest point on line segment
  const closestLat = lineStartLat + t * dLat;
  const closestLon = lineStartLon + t * dLon;

  return haversineKm(pointLat, pointLon, closestLat, closestLon);
}

// ----------------------------------------------------------
// Validate route compatibility
// ----------------------------------------------------------

export function validateRouteCompatibility(
  ride,
  pickupLat,
  pickupLon,
  dropLat,
  dropLon
) {
  const oLat = ride.originLatitude;
  const oLon = ride.originLongitude;
  const dLat = ride.destinationLatitude;
  const dLon = ride.destinationLongitude;

  // Driver vector
  const dvLat = dLat - oLat;
  const dvLon = dLon - oLon;
  const driverLenSq = dvLat * dvLat + dvLon * dvLon;

  if (driverLenSq === 0) {
    return { valid: false, reason: 'Driver origin and destination are the same point' };
  }

  // Passenger vector
  const pvLat = dropLat - pickupLat;
  const pvLon = dropLon - pickupLon;

  // 1. Direction alignment: dot product > 0
  const dot = dvLat * pvLat + dvLon * pvLon;
  if (dot <= 0) {
    return {
      valid: false,
      reason: 'Your travel direction is opposite to the driver\'s route'
    };
  }

  // 2. Projections along driver route
  const tPickup =
    ((pickupLat - oLat) * dvLat + (pickupLon - oLon) * dvLon) / driverLenSq;
  const tDrop =
    ((dropLat - oLat) * dvLat + (dropLon - oLon) * dvLon) / driverLenSq;

  // Forward ordering: pickup must be before drop along driver route
  if (tPickup >= tDrop) {
    return {
      valid: false,
      reason: 'Your drop-off must be further along the driver\'s route than your pickup'
    };
  }

  // Reasonable range (slight tolerance)
  if (tPickup < -0.2) {
    return {
      valid: false,
      reason: 'Your pickup is too far before the driver\'s starting point'
    };
  }

  if (tDrop > 1.2) {
    return {
      valid: false,
      reason: 'Your drop-off is too far beyond the driver\'s destination'
    };
  }

  // 3. Corridor proximity (perpendicular distance)
  const pickupPerp = perpendicularDistanceKm(
    pickupLat, pickupLon, oLat, oLon, dLat, dLon
  );

  if (pickupPerp > MAX_CORRIDOR_KM) {
    return {
      valid: false,
      reason: `Your pickup is ${pickupPerp.toFixed(1)} km from the driver's route (max ${MAX_CORRIDOR_KM} km)`
    };
  }

  const dropPerp = perpendicularDistanceKm(
    dropLat, dropLon, oLat, oLon, dLat, dLon
  );

  if (dropPerp > MAX_CORRIDOR_KM) {
    return {
      valid: false,
      reason: `Your drop-off is ${dropPerp.toFixed(1)} km from the driver's route (max ${MAX_CORRIDOR_KM} km)`
    };
  }

  return { valid: true };
}

// ----------------------------------------------------------
// Calculate passenger fare
// ----------------------------------------------------------

export async function calculatePassengerFare(
  ride,
  pickupLat,
  pickupLon,
  dropLat,
  dropLon,
  seatsBooked
) {
  const pricePerKm = Number(ride.pricePerKm) || 5.0;
  const totalTripCost = Number(ride.totalTripCost) || 0;

  // Get driving distance for passenger segment
  const { distanceKm, source } = await getDrivingDistanceKm(
    pickupLat, pickupLon, dropLat, dropLon
  );

  // Per-seat fare: max(MIN_FARE, distance × rate)
  const rawPerSeat = distanceKm * pricePerKm;
  const perSeatFare = Math.max(MIN_FARE, rawPerSeat);
  const minFareApplied = rawPerSeat < MIN_FARE;

  // Cap: passenger should never pay more than total trip cost per seat
  let cappedPerSeat = perSeatFare;
  if (totalTripCost > 0) {
    cappedPerSeat = Math.min(perSeatFare, totalTripCost);
  }

  const totalFare = Number((cappedPerSeat * seatsBooked).toFixed(2));

  return {
    fare: totalFare,
    distanceKm,
    distanceSource: source,
    pricePerKm,
    seatsBooked,
    perSeatFare: Number(cappedPerSeat.toFixed(2)),
    minFareApplied
  };
}
