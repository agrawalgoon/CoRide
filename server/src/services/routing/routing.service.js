// ============================================================
// Authoritative Road Distance & Multi-Provider Routing Service
// ============================================================
// Providers:
// 1. Google Maps Platform Routes API (v2 computeRoutes)
// 2. OpenRouteService (Directions v2)
// 3. OSRM (Open Source Routing Machine)
//
// In addition to point-to-point road distance, this service provides:
// - Waypoint / intermediate stop routing
// - Leg-by-leg breakdown and polyline geometry
// - Fuel-cost calculations based on vehicle mileage & fuel price
// - Segment-based fair cost sharing for multiple passengers
// ============================================================

const EARTH_RADIUS_KM = 6371;
const ROUTING_TIMEOUT_MS = 6000;
const MIN_FARE = 10; // ₹ minimum per-seat fare
const MAX_CORRIDOR_KM = 10; // max perpendicular distance from driver route

// In-memory route cache: key -> { data, timestamp }
const routeCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

/**
 * Geometric Haversine distance (km) — exclusively for preliminary spatial indexing / corridor checks.
 * NEVER used as verified road distance.
 */
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

/**
 * Make Google Maps Routes API call (computeRoutes)
 */
async function callGoogleRoutesApi({ origin, destination, intermediates = [] }) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_ROUTES_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY is not configured');
  }

  const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';

  const body = {
    origin: {
      location: {
        latLng: {
          latitude: origin.latitude,
          longitude: origin.longitude
        }
      }
    },
    destination: {
      location: {
        latLng: {
          latitude: destination.latitude,
          longitude: destination.longitude
        }
      }
    },
    intermediates: intermediates.map((pt) => ({
      location: {
        latLng: {
          latitude: pt.latitude,
          longitude: pt.longitude
        }
      }
    })),
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_UNAWARE',
    computeAlternativeRoutes: false,
    polylineQuality: 'HIGH_QUALITY'
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ROUTING_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration,routes.legs.polyline.encodedPolyline'
      },
      body: JSON.stringify(body)
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Routes API error HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const route = data.routes?.[0];

    if (!route || typeof route.distanceMeters !== 'number') {
      throw new Error('Google Routes API returned no routes');
    }

    const distanceMeters = route.distanceMeters;
    const distanceKm = Number((distanceMeters / 1000).toFixed(2));
    const durationSeconds = route.duration ? parseInt(route.duration, 10) : 0;
    const durationMinutes = Math.round(durationSeconds / 60);

    const legs = (route.legs || []).map((leg, idx) => ({
      legIndex: idx,
      distanceMeters: leg.distanceMeters,
      distanceKm: Number((leg.distanceMeters / 1000).toFixed(2)),
      durationSeconds: leg.duration ? parseInt(leg.duration, 10) : 0,
      durationMinutes: Math.round((leg.duration ? parseInt(leg.duration, 10) : 0) / 60),
      encodedPolyline: leg.polyline?.encodedPolyline || null
    }));

    return {
      distanceMeters,
      distanceKm,
      durationSeconds,
      durationMinutes,
      encodedPolyline: route.polyline?.encodedPolyline || null,
      legs,
      provider: 'google_routes',
      status: 'SUCCESS'
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Make OpenRouteService call (openrouteservice.org)
 */
async function callOpenRouteService({ origin, destination, intermediates = [] }) {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY || process.env.ORS_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTESERVICE_API_KEY is not configured');
  }

  const url = 'https://api.openrouteservice.org/v2/directions/driving-car';

  const coordinates = [
    [origin.longitude, origin.latitude],
    ...intermediates.map((pt) => [pt.longitude, pt.latitude]),
    [destination.longitude, destination.latitude]
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ROUTING_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey
      },
      body: JSON.stringify({
        coordinates,
        instructions: false,
        elevation: false
      })
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouteService HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const route = data.routes?.[0];

    if (!route || !route.summary) {
      throw new Error('OpenRouteService returned no route summary');
    }

    const distanceMeters = Math.round(route.summary.distance);
    const distanceKm = Number((distanceMeters / 1000).toFixed(2));
    const durationSeconds = Math.round(route.summary.duration);
    const durationMinutes = Math.round(durationSeconds / 60);

    const legs = (route.segments || []).map((seg, idx) => ({
      legIndex: idx,
      distanceMeters: Math.round(seg.distance),
      distanceKm: Number((seg.distance / 1000).toFixed(2)),
      durationSeconds: Math.round(seg.duration),
      durationMinutes: Math.round(seg.duration / 60),
      encodedPolyline: null
    }));

    return {
      distanceMeters,
      distanceKm,
      durationSeconds,
      durationMinutes,
      encodedPolyline: route.geometry || null,
      legs,
      provider: 'openrouteservice',
      status: 'SUCCESS'
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Make OSRM routing call
 */
async function callOsrmService({ origin, destination, intermediates = [] }) {
  const points = [origin, ...intermediates, destination];
  const coordStr = points.map((p) => `${p.longitude},${p.latitude}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=polyline`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ROUTING_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CoRide-CarpoolPlatform/2.0 (academic-fyp)'
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`OSRM HTTP ${response.status}`);
    }

    const data = await response.json();

    if (
      data.code === 'Ok' &&
      Array.isArray(data.routes) &&
      data.routes.length > 0 &&
      data.routes[0].distance >= 0
    ) {
      const route = data.routes[0];
      const distanceMeters = Math.round(route.distance);
      const distanceKm = Number((distanceMeters / 1000).toFixed(2));
      const durationSeconds = Math.round(route.duration);
      const durationMinutes = Math.round(durationSeconds / 60);

      const legs = (route.legs || []).map((leg, idx) => ({
        legIndex: idx,
        distanceMeters: Math.round(leg.distance),
        distanceKm: Number((leg.distance / 1000).toFixed(2)),
        durationSeconds: Math.round(leg.duration),
        durationMinutes: Math.round(leg.duration / 60),
        encodedPolyline: null
      }));

      return {
        distanceMeters,
        distanceKm,
        durationSeconds,
        durationMinutes,
        encodedPolyline: route.geometry || null,
        legs,
        provider: 'osrm',
        status: 'SUCCESS'
      };
    }

    throw new Error('OSRM returned no valid route');
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Authoritative Road Route Calculation
 * Hierarchy: Google Routes API -> OpenRouteService -> OSRM
 * Never falls back to straight-line distance silently.
 */
export async function computeAuthoritativeRoadRoute({ origin, destination, intermediates = [] }) {
  if (
    !origin ||
    !destination ||
    !Number.isFinite(Number(origin.latitude)) ||
    !Number.isFinite(Number(origin.longitude)) ||
    !Number.isFinite(Number(destination.latitude)) ||
    !Number.isFinite(Number(destination.longitude))
  ) {
    throw new Error('Valid origin and destination coordinates are required for road distance calculation');
  }

  const normOrigin = { latitude: Number(origin.latitude), longitude: Number(origin.longitude) };
  const normDest = { latitude: Number(destination.latitude), longitude: Number(destination.longitude) };
  const normInter = intermediates.map((p) => ({
    latitude: Number(p.latitude),
    longitude: Number(p.longitude)
  }));

  // Cache check
  const cacheKey = JSON.stringify({ o: normOrigin, d: normDest, i: normInter });
  const cached = routeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const errors = [];

  // 1. Try Google Maps Routes API if key is present
  if (process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_ROUTES_API_KEY) {
    try {
      const res = await callGoogleRoutesApi({
        origin: normOrigin,
        destination: normDest,
        intermediates: normInter
      });
      routeCache.set(cacheKey, { data: res, timestamp: Date.now() });
      return res;
    } catch (err) {
      errors.push(`Google: ${err.message}`);
    }
  }

  // 2. Try OpenRouteService if key is present
  if (process.env.OPENROUTESERVICE_API_KEY || process.env.ORS_API_KEY) {
    try {
      const res = await callOpenRouteService({
        origin: normOrigin,
        destination: normDest,
        intermediates: normInter
      });
      routeCache.set(cacheKey, { data: res, timestamp: Date.now() });
      return res;
    } catch (err) {
      errors.push(`OpenRouteService: ${err.message}`);
    }
  }

  // 3. Fallback to OSRM road routing network
  try {
    const res = await callOsrmService({
      origin: normOrigin,
      destination: normDest,
      intermediates: normInter
    });
    routeCache.set(cacheKey, { data: res, timestamp: Date.now() });
    return res;
  } catch (err) {
    errors.push(`OSRM: ${err.message}`);
  }

  // All authoritative providers failed
  const errorMsg = `Unable to compute road route via Google Routes API, OpenRouteService, or OSRM. Details: ${errors.join(' | ')}`;
  const failure = new Error(errorMsg);
  failure.routingFailed = true;
  throw failure;
}

/**
 * Backward-compatible helper for 2 points
 */
export async function getDrivingDistanceKm(lat1, lon1, lat2, lon2) {
  const route = await computeAuthoritativeRoadRoute({
    origin: { latitude: lat1, longitude: lon1 },
    destination: { latitude: lat2, longitude: lon2 }
  });

  return {
    distanceKm: route.distanceKm,
    distanceMeters: route.distanceMeters,
    durationMinutes: route.durationMinutes,
    source: route.provider
  };
}

// ----------------------------------------------------------
// Fuel-Cost Calculation (Section 4)
// Formula:
// Fuel required in litres = Road distance in km / Vehicle mileage in km/litre
// Estimated fuel cost = Fuel required * Fuel price per litre
// ----------------------------------------------------------
export function calculateFuelCost({
  roadDistanceKm,
  mileageKmPerLitre = 15,
  fuelPricePerLitre = 105
}) {
  const dist = Number(roadDistanceKm) || 0;
  const mileage = Math.max(1, Number(mileageKmPerLitre) || 15);
  const fuelPrice = Math.max(0, Number(fuelPricePerLitre) || 105);

  const rawLitres = dist / mileage;
  const fuelRequiredLitres = Number(rawLitres.toFixed(3));
  const estimatedFuelCost = Number((rawLitres * fuelPrice).toFixed(2));

  return {
    roadDistanceKm: Number(dist.toFixed(2)),
    mileageKmPerLitre: mileage,
    fuelPricePerLitre: fuelPrice,
    fuelRequiredLitres,
    estimatedFuelCost
  };
}

// ----------------------------------------------------------
// Segment-Based Fair Cost Sharing for Multiple Passengers (Section 5)
// ----------------------------------------------------------
/**
 * Segments driver route based on all ordered stops (driver origin, passenger pickups/drops, driver destination).
 * Each leg has a shared cost divided among participants actively present on that leg.
 *
 * @param {Object} params
 * @param {Object} params.driverRoute - { origin, destination, roadDistanceKm }
 * @param {Array} params.passengers - [ { id, name, pickup: {lat, lon}, drop: {lat, lon}, seatsBooked: 1 } ]
 * @param {number} params.mileageKmPerLitre - vehicle mileage
 * @param {number} params.fuelPricePerLitre - price per litre
 * @param {boolean} params.driverSharesFuelCost - true if driver also pays 1 share, false if expenses split among passengers
 */
export async function calculateSegmentFairCostSharing({
  driverRoute,
  passengers = [],
  mileageKmPerLitre = 15,
  fuelPricePerLitre = 105,
  driverSharesFuelCost = true
}) {
  const oLat = Number(driverRoute.origin.latitude);
  const oLon = Number(driverRoute.origin.longitude);
  const dLat = Number(driverRoute.destination.latitude);
  const dLon = Number(driverRoute.destination.longitude);

  // Driver route vector for 1D projection ordering
  const dvLat = dLat - oLat;
  const dvLon = dLon - oLon;
  const driverLenSq = dvLat * dvLat + dvLon * dvLon || 0.0001;

  // Project any coordinate onto driver's path (t in [0, 1])
  const projectT = (lat, lon) =>
    ((Number(lat) - oLat) * dvLat + (Number(lon) - oLon) * dvLon) / driverLenSq;

  // Collect all stops
  const stops = [
    { type: 'DRIVER_START', id: 'driver_start', lat: oLat, lon: oLon, t: 0, passengerId: null }
  ];

  passengers.forEach((p) => {
    const tPick = Math.max(0, Math.min(0.999, projectT(p.pickup.latitude, p.pickup.longitude)));
    const tDrop = Math.max(tPick + 0.001, Math.min(1.0, projectT(p.drop.latitude, p.drop.longitude)));

    stops.push({
      type: 'PASSENGER_PICKUP',
      id: `pick_${p.id}`,
      lat: Number(p.pickup.latitude),
      lon: Number(p.pickup.longitude),
      t: tPick,
      passengerId: p.id,
      seats: p.seatsBooked || 1
    });

    stops.push({
      type: 'PASSENGER_DROP',
      id: `drop_${p.id}`,
      lat: Number(p.drop.latitude),
      lon: Number(p.drop.longitude),
      t: tDrop,
      passengerId: p.id,
      seats: p.seatsBooked || 1
    });
  });

  stops.push({ type: 'DRIVER_END', id: 'driver_end', lat: dLat, lon: dLon, t: 1.0, passengerId: null });

  // Sort stops strictly along route progression
  stops.sort((a, b) => a.t - b.t);

  // Get total driver road route first
  const fullDriverRoute = await computeAuthoritativeRoadRoute({
    origin: { latitude: oLat, longitude: oLon },
    destination: { latitude: dLat, longitude: dLon }
  });

  const totalTripRoadKm = fullDriverRoute.distanceKm;
  const totalTripFuel = calculateFuelCost({
    roadDistanceKm: totalTripRoadKm,
    mileageKmPerLitre,
    fuelPricePerLitre
  });

  // Active passengers tracker
  const activePassengers = new Map(); // passengerId -> seats
  const legs = [];
  const passengerAllocations = {};
  passengers.forEach((p) => {
    passengerAllocations[p.id] = {
      passengerId: p.id,
      passengerName: p.name || 'Passenger',
      seatsBooked: p.seatsBooked || 1,
      travelledDistanceKm: 0,
      allocatedFuelCost: 0,
      legsParticipated: 0
    };
  });

  let driverShareTotal = 0;

  // Iterate consecutive stop pairs to form route legs
  for (let i = 0; i < stops.length - 1; i++) {
    const fromStop = stops[i];
    const toStop = stops[i + 1];

    // Update active set entering fromStop
    if (fromStop.type === 'PASSENGER_PICKUP') {
      activePassengers.set(fromStop.passengerId, fromStop.seats);
    } else if (fromStop.type === 'PASSENGER_DROP') {
      activePassengers.delete(fromStop.passengerId);
    }

    const tDelta = Math.max(0, toStop.t - fromStop.t);
    if (tDelta <= 0.00001) continue;

    // Approximate leg road distance proportional to authoritative total road distance
    // (preserving authoritative total trip road distance and fuel exact sum)
    const legDistanceKm = Number((totalTripRoadKm * tDelta).toFixed(3));
    const legFuelCost = Number(
      ((legDistanceKm / Math.max(1, mileageKmPerLitre)) * fuelPricePerLitre).toFixed(3)
    );

    // Count participating units (driver = 1 unit if driver shares, plus passenger seats)
    let totalUnits = driverSharesFuelCost ? 1 : 0;
    activePassengers.forEach((seats) => {
      totalUnits += seats;
    });

    const activeList = Array.from(activePassengers.keys());
    const costPerUnit = totalUnits > 0 ? legFuelCost / totalUnits : 0;

    if (driverSharesFuelCost && totalUnits > 0) {
      driverShareTotal += costPerUnit;
    }

    activePassengers.forEach((seats, pId) => {
      const share = costPerUnit * seats;
      passengerAllocations[pId].allocatedFuelCost += share;
      passengerAllocations[pId].travelledDistanceKm += legDistanceKm;
      passengerAllocations[pId].legsParticipated += 1;
    });

    legs.push({
      legIndex: legs.length,
      from: { lat: fromStop.lat, lon: fromStop.lon, type: fromStop.type },
      to: { lat: toStop.lat, lon: toStop.lon, type: toStop.type },
      legDistanceKm: Number(legDistanceKm.toFixed(2)),
      legEstimatedFuelCost: Number(legFuelCost.toFixed(2)),
      activePassengerIds: activeList,
      totalUnits,
      costPerUnit: Number(costPerUnit.toFixed(2))
    });
  }

  // Format and round allocations to 2 decimal places with reconciliation
  let totalAllocatedPassengers = 0;
  const breakdown = Object.values(passengerAllocations).map((item) => {
    const roundedCost = Number(item.allocatedFuelCost.toFixed(2));
    totalAllocatedPassengers += roundedCost;
    return {
      ...item,
      travelledDistanceKm: Number(item.travelledDistanceKm.toFixed(2)),
      allocatedFuelCost: roundedCost
    };
  });

  return {
    provider: fullDriverRoute.provider,
    totalTripRoadDistanceKm: totalTripRoadKm,
    totalTripDurationMinutes: fullDriverRoute.durationMinutes,
    vehicleMileageKmPerLitre: mileageKmPerLitre,
    fuelPricePerLitre,
    totalTripFuelCost: totalTripFuel.estimatedFuelCost,
    totalTripFuelLitres: totalTripFuel.fuelRequiredLitres,
    driverCostShare: Number(driverShareTotal.toFixed(2)),
    totalPassengerAllocations: Number(totalAllocatedPassengers.toFixed(2)),
    reconciliationDifference: Number(
      (totalTripFuel.estimatedFuelCost - (driverShareTotal + totalAllocatedPassengers)).toFixed(2)
    ),
    legs,
    passengerBreakdown: breakdown,
    driverSharesFuelCost
  };
}

// ----------------------------------------------------------
// Perpendicular distance from point to line segment (km)
// For corridor validation
// ----------------------------------------------------------
function perpendicularDistanceKm(
  pointLat,
  pointLon,
  lineStartLat,
  lineStartLon,
  lineEndLat,
  lineEndLon
) {
  const dLat = lineEndLat - lineStartLat;
  const dLon = lineEndLon - lineStartLon;
  const lineLenSq = dLat * dLat + dLon * dLon;

  if (lineLenSq === 0) {
    return haversineKm(pointLat, pointLon, lineStartLat, lineStartLon);
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

  const dvLat = dLat - oLat;
  const dvLon = dLon - oLon;
  const driverLenSq = dvLat * dvLat + dvLon * dvLon;

  if (driverLenSq === 0) {
    return { valid: false, reason: 'Driver origin and destination are the same point' };
  }

  const pvLat = dropLat - pickupLat;
  const pvLon = dropLon - pickupLon;

  // Direction alignment: dot product > 0
  const dot = dvLat * pvLat + dvLon * pvLon;
  if (dot <= 0) {
    return {
      valid: false,
      reason: "Your travel direction is opposite to the driver's route"
    };
  }

  // Forward ordering: pickup must be before drop along driver route
  const tPickup = ((pickupLat - oLat) * dvLat + (pickupLon - oLon) * dvLon) / driverLenSq;
  const tDrop = ((dropLat - oLat) * dvLat + (dropLon - oLon) * dvLon) / driverLenSq;

  if (tPickup >= tDrop) {
    return {
      valid: false,
      reason: "Your drop-off must be further along the driver's route than your pickup"
    };
  }

  if (tPickup < -0.2) {
    return {
      valid: false,
      reason: "Your pickup is too far before the driver's starting point"
    };
  }

  if (tDrop > 1.2) {
    return {
      valid: false,
      reason: "Your drop-off is too far beyond the driver's destination"
    };
  }

  const pickupPerp = perpendicularDistanceKm(pickupLat, pickupLon, oLat, oLon, dLat, dLon);
  if (pickupPerp > MAX_CORRIDOR_KM) {
    return {
      valid: false,
      reason: `Your pickup is ${pickupPerp.toFixed(1)} km from the driver's route (max ${MAX_CORRIDOR_KM} km)`
    };
  }

  const dropPerp = perpendicularDistanceKm(dropLat, dropLon, oLat, oLon, dLat, dLon);
  if (dropPerp > MAX_CORRIDOR_KM) {
    return {
      valid: false,
      reason: `Your drop-off is ${dropPerp.toFixed(1)} km from the driver's route (max ${MAX_CORRIDOR_KM} km)`
    };
  }

  return { valid: true };
}

// ----------------------------------------------------------
// Calculate passenger fare with road distance & fuel cost estimate
// ----------------------------------------------------------
export async function calculatePassengerFare(
  ride,
  pickupLat,
  pickupLon,
  dropLat,
  dropLon,
  seatsBooked = 1
) {
  const pricePerKm = Number(ride.pricePerKm) || 5.0;
  const totalTripCost = Number(ride.totalTripCost) || 0;

  // Authoritative road distance for the passenger segment
  const roadRoute = await computeAuthoritativeRoadRoute({
    origin: { latitude: pickupLat, longitude: pickupLon },
    destination: { latitude: dropLat, longitude: dropLon }
  });

  const distanceKm = roadRoute.distanceKm;

  // Fuel calculation for this passenger's segment
  const fuelEst = calculateFuelCost({
    roadDistanceKm: distanceKm,
    mileageKmPerLitre: 15,
    fuelPricePerLitre: 105
  });

  // Per-seat fare: max(MIN_FARE, distance * rate)
  const rawPerSeat = distanceKm * pricePerKm;
  const perSeatFare = Math.max(MIN_FARE, rawPerSeat);
  const minFareApplied = rawPerSeat < MIN_FARE;

  let cappedPerSeat = perSeatFare;
  if (totalTripCost > 0) {
    cappedPerSeat = Math.min(perSeatFare, totalTripCost);
  }

  const totalFare = Number((cappedPerSeat * seatsBooked).toFixed(2));

  return {
    fare: totalFare,
    distanceKm,
    distanceMeters: roadRoute.distanceMeters,
    durationMinutes: roadRoute.durationMinutes,
    distanceSource: roadRoute.provider,
    pricePerKm,
    seatsBooked,
    perSeatFare: Number(cappedPerSeat.toFixed(2)),
    minFareApplied,
    fuelEstimate: fuelEst
  };
}
