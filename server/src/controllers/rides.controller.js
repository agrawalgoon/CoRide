import { prisma } from '../config/db.js';
import { generateMatches } from '../services/matching/matching.service.js';
import {
  resolveRecurringDays,
  calculateRecurringDates,
  generateRecurringRideInstances,
  syncUpcomingRecurringRides
} from '../services/recurring/recurring.service.js';
import crypto from 'crypto';

const rideSelect = {
  id: true,
  driverId: true,
  vehicleId: true,
  originAddress: true,
  originLandmark: true,
  originLatitude: true,
  originLongitude: true,
  destinationAddress: true,
  destinationLandmark: true,
  destinationLatitude: true,
  destinationLongitude: true,
  departureTime: true,
  totalSeats: true,
  availableSeats: true,
  pricePerSeat: true,
  totalTripCost: true,
  pricePerKm: true,
  isRecurring: true,
  recurringDays: true,
  recurringParentId: true,
  ladiesOnly: true,
  luggageAllowed: true,
  status: true,
  geofenceRadiusMeters: true,
  co2SavedEstimateKg: true,
  createdAt: true,
  updatedAt: true
};

export const createRide = async (req, res, next) => {
  try {
    const {
      vehicleId,
      originAddress,
      originLandmark,
      originLatitude,
      originLongitude,
      destinationAddress,
      destinationLandmark,
      destinationLatitude,
      destinationLongitude,
      departureTime,
      totalSeats,
      pricePerSeat,
      totalTripCost,
      pricePerKm,
      isRecurring,
      recurringDays,
      recurringPattern, // Optional object: { pattern, recurringDays, startDate, endDate, departureTimeOfDay, maxInstances }
      ladiesOnly,
      luggageAllowed,
      geofenceRadiusMeters
    } = req.body;

    if (
      !vehicleId ||
      !originAddress ||
      originLatitude === undefined ||
      originLongitude === undefined ||
      !destinationAddress ||
      destinationLatitude === undefined ||
      destinationLongitude === undefined ||
      !departureTime
    ) {
      return res.status(400).json({
        success: false,
        message: 'All required ride fields must be provided'
      });
    }

    const parsedDepartureTime = new Date(departureTime);
    if (isNaN(parsedDepartureTime.getTime()) || parsedDepartureTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'departureTime must be a valid date in the future'
      });
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        userId: req.user.userId,
        isActive: true
      }
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or does not belong to you'
      });
    }

    const requestedSeats =
      totalSeats !== undefined
        ? Number(totalSeats)
        : vehicle.seatCapacity - 1;

    if (
      !Number.isInteger(requestedSeats) ||
      requestedSeats < 1 ||
      requestedSeats > vehicle.seatCapacity - 1
    ) {
      return res.status(400).json({
        success: false,
        message: `totalSeats must be between 1 and ${vehicle.seatCapacity - 1}`
      });
    }

    // Determine recurring parent ID if marked recurring
    const shouldRecur = Boolean(isRecurring);
    const recurringParentId = shouldRecur ? crypto.randomUUID() : null;

    const ride = await prisma.ride.create({
      data: {
        driverId: req.user.userId,
        vehicleId: vehicle.id,

        originAddress: originAddress.trim(),
        originLandmark: originLandmark?.trim() || null,
        originLatitude: Number(originLatitude),
        originLongitude: Number(originLongitude),

        destinationAddress: destinationAddress.trim(),
        destinationLandmark: destinationLandmark?.trim() || null,
        destinationLatitude: Number(destinationLatitude),
        destinationLongitude: Number(destinationLongitude),

        departureTime: parsedDepartureTime,

        totalSeats: requestedSeats,
        availableSeats: requestedSeats,

        pricePerSeat:
          pricePerSeat !== undefined ? Number(pricePerSeat) : 0,

        totalTripCost:
          totalTripCost !== undefined ? Number(totalTripCost) : 0,

        pricePerKm:
          pricePerKm !== undefined ? Number(pricePerKm) : 5.00,

        isRecurring: shouldRecur,
        recurringDays: recurringDays || null,
        recurringParentId,

        ladiesOnly: Boolean(ladiesOnly),
        luggageAllowed:
          luggageAllowed !== undefined
            ? Boolean(luggageAllowed)
            : true,

        geofenceRadiusMeters:
          geofenceRadiusMeters !== undefined
            ? Number(geofenceRadiusMeters)
            : 150
      },
      select: rideSelect
    });

    let generatedInstances = [];

    // If explicit recurrence configuration is provided, generate future occurrences
    if (shouldRecur && recurringPattern) {
      try {
        const resolvedDays = resolveRecurringDays(
          recurringPattern.pattern,
          recurringPattern.recurringDays || recurringDays || []
        );

        const hours = String(parsedDepartureTime.getHours()).padStart(2, '0');
        const minutes = String(parsedDepartureTime.getMinutes()).padStart(2, '0');
        const defaultTime = `${hours}:${minutes}`;

        const dates = calculateRecurringDates({
          startDate: recurringPattern.startDate || parsedDepartureTime.toISOString(),
          endDate: recurringPattern.endDate,
          departureTimeOfDay: recurringPattern.departureTimeOfDay || defaultTime,
          activeDays: resolvedDays,
          maxInstances: recurringPattern.maxInstances || 30
        });

        // Generate instances (excluding the initial instance already created)
        const futureDates = dates.filter((d) => Math.abs(d.getTime() - parsedDepartureTime.getTime()) > 15 * 60 * 1000);

        const genResult = await generateRecurringRideInstances({
          recurringParentId,
          rideData: {
            driverId: req.user.userId,
            vehicleId: vehicle.id,
            originAddress: originAddress.trim(),
            originLandmark: originLandmark?.trim() || null,
            originLatitude: Number(originLatitude),
            originLongitude: Number(originLongitude),
            destinationAddress: destinationAddress.trim(),
            destinationLandmark: destinationLandmark?.trim() || null,
            destinationLatitude: Number(destinationLatitude),
            destinationLongitude: Number(destinationLongitude),
            totalSeats: requestedSeats,
            pricePerSeat: pricePerSeat !== undefined ? Number(pricePerSeat) : 0,
            totalTripCost: totalTripCost !== undefined ? Number(totalTripCost) : 0,
            pricePerKm: pricePerKm !== undefined ? Number(pricePerKm) : 5.00,
            recurringDays: resolvedDays,
            ladiesOnly: Boolean(ladiesOnly),
            luggageAllowed: luggageAllowed !== undefined ? Boolean(luggageAllowed) : true,
            geofenceRadiusMeters: geofenceRadiusMeters !== undefined ? Number(geofenceRadiusMeters) : 150
          },
          dates: futureDates
        });

        generatedInstances = genResult.created;
      } catch (patternErr) {
        console.warn('[RecurringRide] Pattern generation warning:', patternErr.message);
      }
    }

    const responsePayload = {
      success: true,
      message: 'Ride created successfully',
      ride
    };

    if (generatedInstances.length > 0) {
      responsePayload.recurringSeries = {
        parentRideId: ride.id,
        recurringParentId,
        instancesCreated: generatedInstances.length,
        totalScheduledRides: generatedInstances.length + 1
      };
    }

    return res.status(201).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

export const getRides = async (req, res, next) => {
  try {
    const {
      status = 'SCHEDULED',
      from,
      to
    } = req.query;

    const where = {
      status
    };

    const fromDate = from && !isNaN(new Date(from).getTime()) ? new Date(from) : null;
    const toDate = to && !isNaN(new Date(to).getTime()) ? new Date(to) : null;

    if (fromDate || toDate) {
      where.departureTime = {};
      if (fromDate) {
        where.departureTime.gte = fromDate;
      }
      if (toDate) {
        where.departureTime.lte = toDate;
      }
    }

    if (from && !fromDate) {
      where.OR = [
        { originAddress: { contains: from.trim() } },
        { originLandmark: { contains: from.trim() } }
      ];
    }

    if (to && !toDate) {
      const destinationConditions = [
        { destinationAddress: { contains: to.trim() } },
        { destinationLandmark: { contains: to.trim() } }
      ];
      if (where.OR) {
        where.AND = [{ OR: destinationConditions }];
      } else {
        where.OR = destinationConditions;
      }
    }

    const rides = await prisma.ride.findMany({
      where,
      orderBy: {
        departureTime: 'asc'
      },
      select: {
        ...rideSelect,
        driver: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            driverRatingAvg: true,
            driverRatingCount: true
          }
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            color: true,
            seatCapacity: true,
            vehicleType: true
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      count: rides.length,
      rides
    });
  } catch (error) {
    next(error);
  }
};

export const getMyRides = async (req, res, next) => {
  try {
    const rides = await prisma.ride.findMany({
      where: {
        driverId: req.user.userId
      },
      orderBy: {
        departureTime: 'desc'
      },
      select: {
        ...rideSelect,
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            color: true,
            plateNumber: true,
            seatCapacity: true,
            vehicleType: true
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      count: rides.length,
      rides
    });
  } catch (error) {
    next(error);
  }
};

export const getRideById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ride = await prisma.ride.findUnique({
      where: { id },
      select: {
        ...rideSelect,
        driver: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            driverRatingAvg: true,
            driverRatingCount: true
          }
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            color: true,
            plateNumber: true,
            seatCapacity: true,
            vehicleType: true
          }
        }
      }
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    return res.status(200).json({
      success: true,
      ride
    });
  } catch (error) {
    next(error);
  }
};

export const updateRide = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingRide = await prisma.ride.findUnique({
      where: { id }
    });

    if (!existingRide) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    if (existingRide.driverId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own rides'
      });
    }

    if (existingRide.status !== 'SCHEDULED') {
      return res.status(400).json({
        success: false,
        message: 'Only scheduled rides can be updated'
      });
    }

    const {
      originAddress,
      originLandmark,
      originLatitude,
      originLongitude,
      destinationAddress,
      destinationLandmark,
      destinationLatitude,
      destinationLongitude,
      departureTime,
      pricePerSeat,
      ladiesOnly,
      luggageAllowed,
      geofenceRadiusMeters
    } = req.body;

    if (departureTime !== undefined) {
      const parsedDepartureTime = new Date(departureTime);
      if (isNaN(parsedDepartureTime.getTime()) || parsedDepartureTime <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'departureTime must be a valid date in the future'
        });
      }
    }

    const ride = await prisma.ride.update({
      where: { id },
      data: {
        ...(originAddress !== undefined && {
          originAddress: originAddress.trim()
        }),
        ...(originLandmark !== undefined && {
          originLandmark: originLandmark?.trim() || null
        }),
        ...(originLatitude !== undefined && {
          originLatitude: Number(originLatitude)
        }),
        ...(originLongitude !== undefined && {
          originLongitude: Number(originLongitude)
        }),
        ...(destinationAddress !== undefined && {
          destinationAddress: destinationAddress.trim()
        }),
        ...(destinationLandmark !== undefined && {
          destinationLandmark: destinationLandmark?.trim() || null
        }),
        ...(destinationLatitude !== undefined && {
          destinationLatitude: Number(destinationLatitude)
        }),
        ...(destinationLongitude !== undefined && {
          destinationLongitude: Number(destinationLongitude)
        }),
        ...(departureTime !== undefined && {
          departureTime: new Date(departureTime)
        }),
        ...(pricePerSeat !== undefined && {
          pricePerSeat: Number(pricePerSeat)
        }),
        ...(ladiesOnly !== undefined && {
          ladiesOnly: Boolean(ladiesOnly)
        }),
        ...(luggageAllowed !== undefined && {
          luggageAllowed: Boolean(luggageAllowed)
        }),
        ...(geofenceRadiusMeters !== undefined && {
          geofenceRadiusMeters: Number(geofenceRadiusMeters)
        })
      },
      select: rideSelect
    });

    return res.status(200).json({
      success: true,
      message: 'Ride updated successfully',
      ride
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRide = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ride = await prisma.ride.findUnique({
      where: { id }
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    if (ride.driverId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own rides'
      });
    }

    if (ride.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Completed rides cannot be cancelled'
      });
    }

    const cancelledRide = await prisma.ride.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      },
      select: rideSelect
    });

    return res.status(200).json({
      success: true,
      message: 'Ride cancelled successfully',
      ride: cancelledRide
    });
  } catch (error) {
    next(error);
  }
};

export const getMatches = async (req, res, next) => {
  try {
    const {
      pickupLatitude,
      pickupLongitude,
      dropLatitude,
      dropLongitude,
      departureTime,
      seats = 1
    } = req.query;

    if (
      pickupLatitude === undefined ||
      pickupLongitude === undefined ||
      dropLatitude === undefined ||
      dropLongitude === undefined ||
      !departureTime
    ) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates (pickup & drop) and departureTime are required for matching.'
      });
    }

    const lat1 = Number(pickupLatitude);
    const lon1 = Number(pickupLongitude);
    const lat2 = Number(dropLatitude);
    const lon2 = Number(dropLongitude);
    const reqSeats = Number(seats);
    const parsedDepartureTime = new Date(departureTime);

    if (
      !Number.isFinite(lat1) || !Number.isFinite(lon1) ||
      !Number.isFinite(lat2) || !Number.isFinite(lon2)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinate values.'
      });
    }

    if (isNaN(parsedDepartureTime.getTime()) || parsedDepartureTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'departureTime must be a valid future date.'
      });
    }

    if (!Number.isInteger(reqSeats) || reqSeats < 1) {
      return res.status(400).json({
        success: false,
        message: 'seats must be a positive integer.'
      });
    }

    // Fetch passenger's orgId
    const passenger = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { organizationId: true }
    });

    const matches = await generateMatches({
      passengerId: req.user.userId,
      passengerOrgId: passenger?.organizationId,
      pickupLatitude: lat1,
      pickupLongitude: lon1,
      dropLatitude: lat2,
      dropLongitude: lon2,
      departureTime: parsedDepartureTime,
      seats: reqSeats
    });

    return res.status(200).json({
      success: true,
      count: matches.length,
      matches
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Cancel future unbooked rides in a recurring series without affecting completed rides
 * or rides with active passenger bookings.
 * DELETE /api/rides/recurring/:parentId
 */
export const cancelRecurringSeries = async (req, res, next) => {
  try {
    const { parentId } = req.params;

    if (!parentId) {
      return res.status(400).json({
        success: false,
        message: 'parentId parameter is required'
      });
    }

    // Find all future scheduled rides in this series
    const futureRides = await prisma.ride.findMany({
      where: {
        recurringParentId: parentId,
        driverId: req.user.userId,
        status: 'SCHEDULED',
        departureTime: { gt: new Date() }
      },
      include: {
        bookings: {
          where: {
            status: { in: ['PENDING', 'ACCEPTED'] }
          }
        }
      }
    });

    if (futureRides.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No future scheduled rides found in this recurring series'
      });
    }

    // Identify rides that have active passenger bookings vs safe to cancel
    const ridesWithBookings = futureRides.filter((r) => r.bookings.length > 0);
    const cancellableRideIds = futureRides
      .filter((r) => r.bookings.length === 0)
      .map((r) => r.id);

    let cancelledCount = 0;
    if (cancellableRideIds.length > 0) {
      const updateResult = await prisma.ride.updateMany({
        where: {
          id: { in: cancellableRideIds }
        },
        data: {
          status: 'CANCELLED'
        }
      });
      cancelledCount = updateResult.count;
    }

    return res.status(200).json({
      success: true,
      message: `Cancelled ${cancelledCount} future ride(s) in the series`,
      cancelledCount,
      protectedRidesWithBookingsCount: ridesWithBookings.length,
      protectedRideIds: ridesWithBookings.map((r) => r.id)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Trigger sync of upcoming recurring ride instances.
 * POST /api/rides/recurring/sync
 */
export const syncRecurringRides = async (req, res, next) => {
  try {
    const summary = await syncUpcomingRecurringRides(req.user.userId);
    return res.status(200).json({
      success: true,
      message: 'Recurring rides synchronized successfully',
      summary
    });
  } catch (error) {
    next(error);
  }
};
