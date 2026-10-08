import { prisma } from '../config/db.js';
import { generateMatches } from '../services/matching/matching.service.js';

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
isRecurring: true,
  recurringDays: true,
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
    isRecurring,
      recurringDays,
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

isRecurring: Boolean(isRecurring),

        isRecurring: Boolean(isRecurring),
        recurringDays: recurringDays || null,

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

    return res.status(201).json({
      success: true,
      message: 'Ride created successfully',
      ride
    });
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

    if (from || to) {
      where.departureTime = {};

      if (from) {
        where.departureTime.gte = new Date(from);
      }

      if (to) {
        where.departureTime.lte = new Date(to);
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