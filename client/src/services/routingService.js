import api from './api';

// Cache in-memory on frontend to reduce redundant network requests
const routeCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 mins

/**
 * Request authoritative road distance, duration, polyline, and fuel cost estimates.
 * Calls backend /api/rides/route which integrates Google Routes API, OpenRouteService, and OSRM.
 *
 * @param {Object} params
 * @param {Object} params.origin { latitude, longitude, address }
 * @param {Object} params.destination { latitude, longitude, address }
 * @param {Array} params.intermediates optional waypoints [{ latitude, longitude }]
 * @param {number} params.mileageKmPerLitre vehicle mileage (km/l)
 * @param {number} params.fuelPricePerLitre fuel price (₹/l)
 */
export const getAuthoritativeRoadRoute = async ({
  origin,
  destination,
  intermediates = [],
  mileageKmPerLitre = 15,
  fuelPricePerLitre = 105
}) => {
  if (
    !origin ||
    !destination ||
    origin.latitude == null ||
    origin.longitude == null ||
    destination.latitude == null ||
    destination.longitude == null
  ) {
    throw new Error('Valid origin and destination coordinates are required');
  }

  const cacheKey = JSON.stringify({
    o: { lat: Number(origin.latitude).toFixed(5), lon: Number(origin.longitude).toFixed(5) },
    d: { lat: Number(destination.latitude).toFixed(5), lon: Number(destination.longitude).toFixed(5) },
    i: intermediates.map((p) => ({
      lat: Number(p.latitude).toFixed(5),
      lon: Number(p.longitude).toFixed(5)
    })),
    m: mileageKmPerLitre,
    f: fuelPricePerLitre
  });

  const cached = routeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const response = await api.post('/rides/route', {
    origin: {
      latitude: Number(origin.latitude),
      longitude: Number(origin.longitude)
    },
    destination: {
      latitude: Number(destination.latitude),
      longitude: Number(destination.longitude)
    },
    intermediates: intermediates.map((p) => ({
      latitude: Number(p.latitude),
      longitude: Number(p.longitude)
    })),
    mileageKmPerLitre: Number(mileageKmPerLitre) || 15,
    fuelPricePerLitre: Number(fuelPricePerLitre) || 105
  });

  const routeData = response.data?.route;
  if (!routeData) {
    throw new Error('No routing data returned from server');
  }

  routeCache.set(cacheKey, { data: routeData, timestamp: Date.now() });
  return routeData;
};

/**
 * Fetch segment-based fair cost sharing breakdown for a ride with multiple passengers.
 */
export const getRideFairCostSharing = async (rideId, options = {}) => {
  const response = await api.get(`/rides/${rideId}/fair-pricing`, {
    params: options
  });
  return response.data?.sharing;
};

/**
 * Calculate fuel cost locally using authoritative formula:
 * Fuel required in litres = Road distance in km / Vehicle mileage in km/litre
 * Estimated fuel cost = Fuel required * Fuel price per litre
 */
export const calculateFuelCost = ({
  roadDistanceKm,
  mileageKmPerLitre = 15,
  fuelPricePerLitre = 105
}) => {
  const dist = Number(roadDistanceKm) || 0;
  const mileage = Math.max(1, Number(mileageKmPerLitre) || 15);
  const fuelPrice = Math.max(0, Number(fuelPricePerLitre) || 105);

  const fuelRequiredLitres = Number((dist / mileage).toFixed(3));
  const estimatedFuelCost = Number((fuelRequiredLitres * fuelPrice).toFixed(2));

  return {
    roadDistanceKm: Number(dist.toFixed(2)),
    mileageKmPerLitre: mileage,
    fuelPricePerLitre: fuelPrice,
    fuelRequiredLitres,
    estimatedFuelCost
  };
};

/**
 * Decode Google / OSRM encoded polyline string to array of [lat, lng] pairs for Leaflet map display
 */
export const decodePolyline = (encoded) => {
  if (!encoded || typeof encoded !== 'string') return [];

  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
};
