import { prisma } from '../../config/db.js';
import { MATCHING_WEIGHTS, MATCHING_THRESHOLDS } from './matching.config.js';
import {
  calculateDistanceKm,
  calculatePerpendicularDistanceKm,
  normalizeScore,
  generateDetailedReasons
} from './matching.utils.js';
import {
  validateRouteCompatibility,
  getDrivingDistanceKm,
  calculatePassengerFare
} from '../routing/routing.service.js';

/**
 * Dynamic Multi-Factor Smart Ride Matching
 * Computes road-route compatibility, detour, corridor proximity, and temporal alignment.
 * Replaces fixed 88% scores with dynamic, mathematically sound scores.
 */
export const generateMatches = async ({
  passengerId,
  passengerOrgId,
  pickupLatitude,
  pickupLongitude,
  dropLatitude,
  dropLongitude,
  departureTime,
  seats = 1
}) => {
  const searchTime = new Date(departureTime);

  // Time window: +/- 3 hours
  const minTime = new Date(
    searchTime.getTime() - MATCHING_THRESHOLDS.MAX_TIME_DIFF_HOURS * 3600000
  );
  const maxTime = new Date(
    searchTime.getTime() + MATCHING_THRESHOLDS.MAX_TIME_DIFF_HOURS * 3600000
  );

  // 1. Database-Level Filtering: Available seats and departure window
  const candidateRides = await prisma.ride.findMany({
    where: {
      status: 'SCHEDULED',
      availableSeats: { gte: Number(seats) },
      departureTime: { gte: minTime, lte: maxTime },
      driverId: { not: passengerId } // Cannot match with own rides
    },
    include: {
      driver: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          organizationId: true,
          driverRatingAvg: true,
          driverRatingCount: true,
          isDlVerified: true,
          preferences: true
        }
      },
      vehicle: {
        select: {
          id: true,
          make: true,
          model: true,
          color: true,
          vehicleType: true,
          seatCapacity: true
        }
      },
      bookings: {
        where: { status: { in: ['ACCEPTED', 'BOARDED'] } },
        select: {
          id: true,
          pickupLatitude: true,
          pickupLongitude: true,
          dropLatitude: true,
          dropLongitude: true,
          seatsBooked: true
        }
      }
    }
  });

  const matches = [];

  for (const ride of candidateRides) {
    // 2. Route Direction & Sequence Compatibility Validation
    const compatibility = validateRouteCompatibility(
      ride,
      pickupLatitude,
      pickupLongitude,
      dropLatitude,
      dropLongitude
    );

    // Skip rides with incompatible travel direction or out-of-order drop-offs
    if (!compatibility.valid) {
      continue;
    }

    // 3. Corridor Proximity Checks
    // Pickup distance from driver's direct road corridor
    const pickupCorridorKm = calculatePerpendicularDistanceKm(
      pickupLatitude,
      pickupLongitude,
      ride.originLatitude,
      ride.originLongitude,
      ride.destinationLatitude,
      ride.destinationLongitude
    );

    // Drop distance to driver's destination
    const dropDistanceKm = calculateDistanceKm(
      dropLatitude,
      dropLongitude,
      ride.destinationLatitude,
      ride.destinationLongitude
    );

    // Filter out candidates outside max corridor tolerance
    if (
      pickupCorridorKm > MATCHING_THRESHOLDS.MAX_PICKUP_CORRIDOR_KM ||
      dropDistanceKm > MATCHING_THRESHOLDS.MAX_DROP_CORRIDOR_KM
    ) {
      continue;
    }

    // 4. Actual Road Distance & Detour Calculation
    // Direct driver road distance
    let driverDirectRoadKm = 0;
    try {
      const driverRoute = await getDrivingDistanceKm(
        ride.originLatitude,
        ride.originLongitude,
        ride.destinationLatitude,
        ride.destinationLongitude
      );
      driverDirectRoadKm = driverRoute.distanceKm;
    } catch {
      driverDirectRoadKm = calculateDistanceKm(
        ride.originLatitude,
        ride.originLongitude,
        ride.destinationLatitude,
        ride.destinationLongitude
      ) * 1.3;
    }

    // Passenger road distance
    let passengerRoadKm = 0;
    try {
      const passengerRoute = await getDrivingDistanceKm(
        pickupLatitude,
        pickupLongitude,
        dropLatitude,
        dropLongitude
      );
      passengerRoadKm = passengerRoute.distanceKm;
    } catch {
      passengerRoadKm = calculateDistanceKm(
        pickupLatitude,
        pickupLongitude,
        dropLatitude,
        dropLongitude
      ) * 1.3;
    }

    // Detour estimation: extra road distance required for the pickup and drop
    // Origin -> Pickup + Passenger Road + Drop -> Destination
    const pickupLegKm = calculateDistanceKm(
      ride.originLatitude,
      ride.originLongitude,
      pickupLatitude,
      pickupLongitude
    ) * 1.25;
    const dropLegKm = calculateDistanceKm(
      dropLatitude,
      dropLongitude,
      ride.destinationLatitude,
      ride.destinationLongitude
    ) * 1.25;

    const estimatedTripWithPassengerKm = pickupLegKm + passengerRoadKm + dropLegKm;
    const rawDetourKm = Math.max(0, estimatedTripWithPassengerKm - driverDirectRoadKm);
    const detourKm = Number(rawDetourKm.toFixed(2));

    // Reject if detour is excessive (> max allowable detour)
    if (detourKm > MATCHING_THRESHOLDS.MAX_ALLOWABLE_DETOUR_KM) {
      continue;
    }

    // 5. Dynamic Subscores (0 - 100)
    // A. Route Detour & Alignment Score (30%)
    const routeScore = normalizeScore(
      detourKm,
      0,
      MATCHING_THRESHOLDS.MAX_ALLOWABLE_DETOUR_KM,
      true
    );

    // B. Pickup Proximity Score (25%)
    const pickupScore = normalizeScore(
      pickupCorridorKm,
      0,
      MATCHING_THRESHOLDS.MAX_PICKUP_CORRIDOR_KM,
      true
    );

    // C. Destination Proximity Score (20%)
    const dropScore = normalizeScore(
      dropDistanceKm,
      0,
      MATCHING_THRESHOLDS.MAX_DROP_CORRIDOR_KM,
      true
    );

    // D. Departure Time Synchronization Score (15%)
    const diffMinutes = Math.round(
      Math.abs(ride.departureTime.getTime() - searchTime.getTime()) / 60000
    );
    const timeScore = normalizeScore(
      diffMinutes,
      0,
      MATCHING_THRESHOLDS.MAX_TIME_DIFF_HOURS * 60,
      true
    );

    // E. Trust & Verification Score (10%)
    const isSameOrg = Boolean(
      ride.driver.organizationId &&
      passengerOrgId &&
      ride.driver.organizationId === passengerOrgId
    );
    const orgBonus = isSameOrg ? 50 : 0;
    const ratingScore = normalizeScore(ride.driver.driverRatingAvg || 4.5, 1, 5, false) * 0.5;
    const trustScore = Math.min(100, Math.round(orgBonus + ratingScore));

    // Weighted Overall Score
    const overallScore = Math.round(
      routeScore * MATCHING_WEIGHTS.ROUTE +
      pickupScore * MATCHING_WEIGHTS.PICKUP +
      dropScore * MATCHING_WEIGHTS.DESTINATION +
      timeScore * MATCHING_WEIGHTS.TIME +
      trustScore * MATCHING_WEIGHTS.TRUST
    );

    // 6. Calculate Passenger Fair Cost on this Route
    let fareQuote = null;
    try {
      fareQuote = await calculatePassengerFare(
        ride,
        pickupLatitude,
        pickupLongitude,
        dropLatitude,
        dropLongitude,
        Number(seats)
      );
    } catch {
      fareQuote = { fare: Number((passengerRoadKm * 5).toFixed(2)) };
    }

    // Explanatory reasons for the match score
    const reasons = generateDetailedReasons({
      pickupCorridorKm,
      dropDistanceKm,
      detourKm,
      diffMinutes,
      isSameOrg,
      driverRating: ride.driver.driverRatingAvg || 5.0
    });

    matches.push({
      rideId: ride.id,
      overallScore,
      scores: {
        route: routeScore,
        pickup: pickupScore,
        destination: dropScore,
        time: timeScore,
        trust: trustScore
      },
      details: {
        pickupCorridorKm: Number(pickupCorridorKm.toFixed(2)),
        dropDistanceKm: Number(dropDistanceKm.toFixed(2)),
        detourKm,
        passengerRoadDistanceKm: Number(passengerRoadKm.toFixed(2)),
        departureDifferenceMinutes: diffMinutes,
        calculatedFare: fareQuote.fare,
        availableSeats: ride.availableSeats
      },
      reasons,
      ride
    });
  }

  // Sort descending by highest match score
  return matches.sort((a, b) => b.overallScore - a.overallScore);
};
