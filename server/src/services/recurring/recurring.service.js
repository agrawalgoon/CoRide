import { prisma } from '../../config/db.js';
import crypto from 'crypto';

const DAY_MAP = {
  0: 'SUN',
  1: 'MON',
  2: 'TUE',
  3: 'WED',
  4: 'THU',
  5: 'FRI',
  6: 'SAT'
};

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const ALL_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/**
 * Resolve effective active days based on recurrence pattern
 */
export function resolveRecurringDays(pattern, customDays = []) {
  if (pattern === 'DAILY') {
    return ALL_DAYS;
  }
  if (pattern === 'WEEKDAYS') {
    return WEEKDAYS;
  }
  if (pattern === 'CUSTOM') {
    if (!Array.isArray(customDays) || customDays.length === 0) {
      throw new Error('CUSTOM pattern requires at least one day in recurringDays');
    }
    const validSet = new Set(ALL_DAYS);
    const upper = customDays.map((d) => String(d).toUpperCase().trim());
    for (const d of upper) {
      if (!validSet.has(d)) {
        throw new Error(`Invalid recurring day: ${d}. Must be one of: ${ALL_DAYS.join(', ')}`);
      }
    }
    return Array.from(new Set(upper));
  }
  throw new Error(`Invalid pattern: ${pattern}. Must be DAILY, WEEKDAYS, or CUSTOM.`);
}

/**
 * Compute valid departure timestamps for recurrence pattern
 */
export function calculateRecurringDates({
  startDate,
  endDate,
  departureTimeOfDay, // 'HH:MM'
  activeDays, // ['MON', 'TUE', ...]
  maxInstances = 30
}) {
  const [hours, minutes] = departureTimeOfDay.split(':').map(Number);
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000); // Max 90 days out

  if (isNaN(start.getTime())) {
    throw new Error('Invalid startDate provided');
  }
  if (isNaN(end.getTime())) {
    throw new Error('Invalid endDate provided');
  }
  if (end < start) {
    throw new Error('endDate cannot be earlier than startDate');
  }

  const activeSet = new Set(activeDays);
  const results = [];
  const now = new Date();

  // Iterate day by day from start to end (up to 90 days max or maxInstances)
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);

  const loopLimit = 90; // Hard guard against infinite loops
  let iterations = 0;

  while (current <= end && results.length < maxInstances && iterations < loopLimit) {
    iterations++;
    const dayName = DAY_MAP[current.getDay()];

    if (activeSet.has(dayName)) {
      const departure = new Date(current);
      departure.setHours(hours, minutes, 0, 0);

      // Only generate instances in the future
      if (departure > now) {
        results.push(departure);
      }
    }

    // Advance 1 day
    current.setDate(current.getDate() + 1);
  }

  return results;
}

/**
 * Generate ride instances for a recurring template idempotently.
 *
 * @param {Object} params
 * @param {string} params.recurringParentId - UUID grouping the series
 * @param {Object} params.rideData - Base ride template parameters
 * @param {Array<Date>} params.dates - Target departure dates
 * @returns {Promise<{ created: Array, skippedCount: number }>}
 */
export async function generateRecurringRideInstances({
  recurringParentId,
  rideData,
  dates
}) {
  if (!recurringParentId || !Array.isArray(dates) || dates.length === 0) {
    return { created: [], skippedCount: 0 };
  }

  const createdRides = [];
  let skippedCount = 0;

  for (const date of dates) {
    // 15-minute duplicate check window around the target departure time
    const windowStart = new Date(date.getTime() - 15 * 60 * 1000);
    const windowEnd = new Date(date.getTime() + 15 * 60 * 1000);

    const existingInstance = await prisma.ride.findFirst({
      where: {
        driverId: rideData.driverId,
        departureTime: {
          gte: windowStart,
          lte: windowEnd
        },
        status: { in: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] }
      }
    });

    if (existingInstance) {
      skippedCount++;
      continue;
    }

    // Create unique instance preserving all ride parameters
    const newRide = await prisma.ride.create({
      data: {
        driverId: rideData.driverId,
        vehicleId: rideData.vehicleId,
        originAddress: rideData.originAddress,
        originLandmark: rideData.originLandmark || null,
        originLatitude: rideData.originLatitude,
        originLongitude: rideData.originLongitude,
        destinationAddress: rideData.destinationAddress,
        destinationLandmark: rideData.destinationLandmark || null,
        destinationLatitude: rideData.destinationLatitude,
        destinationLongitude: rideData.destinationLongitude,
        departureTime: date,
        totalSeats: rideData.totalSeats,
        availableSeats: rideData.totalSeats,
        pricePerSeat: rideData.pricePerSeat || 0,
        totalTripCost: rideData.totalTripCost || 0,
        pricePerKm: rideData.pricePerKm || 5.0,
        isRecurring: true,
        recurringDays: rideData.recurringDays || null,
        recurringParentId,
        ladiesOnly: Boolean(rideData.ladiesOnly),
        luggageAllowed: rideData.luggageAllowed !== undefined ? Boolean(rideData.luggageAllowed) : true,
        geofenceRadiusMeters: rideData.geofenceRadiusMeters || 150
      }
    });

    createdRides.push(newRide);
  }

  return { created: createdRides, skippedCount };
}

/**
 * On-demand synchronization/creation of upcoming recurring ride instances.
 * Guarantees that at least the next N occurrences (default 7 days) exist in the database.
 * Can be invoked by scheduled cron, background heartbeat, or when driver views their rides.
 */
export async function syncUpcomingRecurringRides(driverId = null) {
  const where = {
    isRecurring: true,
    recurringParentId: { not: null },
    status: 'SCHEDULED'
  };

  if (driverId) {
    where.driverId = driverId;
  }

  // Find distinct recurring parent series
  const recurringRides = await prisma.ride.findMany({
    where,
    distinct: ['recurringParentId'],
    orderBy: { createdAt: 'desc' }
  });

  const summary = {
    parentsProcessed: recurringRides.length,
    instancesCreated: 0,
    skippedCount: 0
  };

  const horizonDays = 14;
  const now = new Date();
  const endDate = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);

  for (const parent of recurringRides) {
    if (!parent.recurringParentId || !parent.recurringDays) continue;

    const days = Array.isArray(parent.recurringDays) ? parent.recurringDays : [];
    if (days.length === 0) continue;

    const timeStr = `${String(parent.departureTime.getHours()).padStart(2, '0')}:${String(parent.departureTime.getMinutes()).padStart(2, '0')}`;

    const dates = calculateRecurringDates({
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      departureTimeOfDay: timeStr,
      activeDays: days,
      maxInstances: 14
    });

    const result = await generateRecurringRideInstances({
      recurringParentId: parent.recurringParentId,
      rideData: {
        driverId: parent.driverId,
        vehicleId: parent.vehicleId,
        originAddress: parent.originAddress,
        originLandmark: parent.originLandmark,
        originLatitude: parent.originLatitude,
        originLongitude: parent.originLongitude,
        destinationAddress: parent.destinationAddress,
        destinationLandmark: parent.destinationLandmark,
        destinationLatitude: parent.destinationLatitude,
        destinationLongitude: parent.destinationLongitude,
        totalSeats: parent.totalSeats,
        pricePerSeat: parent.pricePerSeat,
        totalTripCost: parent.totalTripCost,
        pricePerKm: parent.pricePerKm,
        recurringDays: parent.recurringDays,
        ladiesOnly: parent.ladiesOnly,
        luggageAllowed: parent.luggageAllowed,
        geofenceRadiusMeters: parent.geofenceRadiusMeters
      },
      dates
    });

    summary.instancesCreated += result.created.length;
    summary.skippedCount += result.skippedCount;
  }

  return summary;
}
