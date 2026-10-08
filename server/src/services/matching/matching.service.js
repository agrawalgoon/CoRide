import { prisma } from '../../config/db.js';
import { MATCHING_WEIGHTS, MATCHING_THRESHOLDS } from './matching.config.js';
import { calculateDistanceKm, normalizeScore, generateReasons } from './matching.utils.js';

/**
 * AI-Assisted Matching Foundation
 * Calculates geographic, temporal, organization, and preference compatibility.
 */
export const generateMatches = async ({
  passengerId,
  passengerOrgId,
  pickupLatitude,
  pickupLongitude,
  dropLatitude,
  dropLongitude,
  departureTime,
  seats
}) => {
  const searchTime = new Date(departureTime);
  
  // Create search window
  const minTime = new Date(searchTime.getTime() - MATCHING_THRESHOLDS.MAX_TIME_DIFF_HOURS * 3600000);
  const maxTime = new Date(searchTime.getTime() + MATCHING_THRESHOLDS.MAX_TIME_DIFF_HOURS * 3600000);

  // 1. Database-Level Filtering
  // Filter out completely incompatible rides first
  const candidateRides = await prisma.ride.findMany({
    where: {
      status: 'SCHEDULED',
      availableSeats: { gte: seats },
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
      }
    }
  });

  const matches = [];

  // 2. Score Computation (To be replaced by ML Model later)
  for (const ride of candidateRides) {
    // Proximity logic
    const pickupDist = calculateDistanceKm(pickupLatitude, pickupLongitude, ride.originLatitude, ride.originLongitude);
    const dropDist = calculateDistanceKm(dropLatitude, dropLongitude, ride.destinationLatitude, ride.destinationLongitude);

    // Hard drop if too far
    if (pickupDist > MATCHING_THRESHOLDS.MAX_PICKUP_DISTANCE_KM || dropDist > MATCHING_THRESHOLDS.MAX_DROP_DISTANCE_KM) {
      continue;
    }

    // A. Route Score (40%)
    const totalDist = pickupDist + dropDist;
    const routeScore = normalizeScore(totalDist, 0, MATCHING_THRESHOLDS.MAX_TOTAL_ROUTE_DEVIATION_KM, true);

    // B. Time Score (25%)
    const diffHours = Math.abs(ride.departureTime.getTime() - searchTime.getTime()) / 3600000;
    const timeScore = normalizeScore(diffHours, 0, MATCHING_THRESHOLDS.MAX_TIME_DIFF_HOURS, true);

    // C. Organization Score (15%)
    const isSameOrg = (ride.driver.organizationId && passengerOrgId && ride.driver.organizationId === passengerOrgId);
    const orgScore = isSameOrg ? 100 : 0;

    // D. Preferences Score (10%)
    // Base 80 unless specific constraints fail/succeed. (E.g., ladiesOnly checking would happen here if we had gender)
    const prefScore = 80;

    // E. Convenience/Quality Score (10%)
    // Factors: Driver rating, remaining seats availability, lower price
    // Base it heavily on rating for now
    const qualityScore = normalizeScore(ride.driver.driverRatingAvg, 1, 5, false);

    // Weighted Total Score
    const overallScore = Number((
      (routeScore * MATCHING_WEIGHTS.ROUTE) +
      (timeScore * MATCHING_WEIGHTS.TIME) +
      (orgScore * MATCHING_WEIGHTS.ORGANIZATION) +
      (prefScore * MATCHING_WEIGHTS.PREFERENCES) +
      (qualityScore * MATCHING_WEIGHTS.CONVENIENCE)
    ).toFixed(1));

    // Meaningful explanations for the UI
    const reasons = generateReasons(pickupDist, dropDist, diffHours, isSameOrg, qualityScore, prefScore >= 80);

    matches.push({
      rideId: ride.id,
      overallScore,
      scores: {
        route: routeScore,
        time: timeScore,
        organization: orgScore,
        preferences: prefScore,
        convenience: qualityScore
      },
      details: {
        pickupDistanceKm: Number(pickupDist.toFixed(2)),
        dropDistanceKm: Number(dropDist.toFixed(2)),
        departureDifferenceMinutes: Math.round(diffHours * 60)
      },
      reasons,
      ride
    });
  }

  // Rank by highest match score
  return matches.sort((a, b) => b.overallScore - a.overallScore);
};
