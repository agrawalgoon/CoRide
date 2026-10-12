import { prisma } from '../config/db.js';
import { validateRouteCompatibility, calculatePassengerFare } from '../services/routing/routing.service.js';

// --------------------------------------------------
// Distance calculation using Haversine formula
// --------------------------------------------------

const calculateDistanceKm = (
  latitude1,
  longitude1,
  latitude2,
  longitude2
) => {
  const earthRadiusKm = 6371;

  const lat1 = (Number(latitude1) * Math.PI) / 180;
  const lat2 = (Number(latitude2) * Math.PI) / 180;

  const deltaLat =
    ((Number(latitude2) - Number(latitude1)) * Math.PI) / 180;

  const deltaLon =
    ((Number(longitude2) - Number(longitude1)) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) ** 2;

  const c =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

// --------------------------------------------------
// Common booking response fields
// --------------------------------------------------

const bookingSelect = {
  id: true,
  rideId: true,
  passengerId: true,
  seatsBooked: true,
  fareContributionTotal: true,
  distanceKm: true,
  pickupAddress: true,
  pickupLatitude: true,
  pickupLongitude: true,
  dropAddress: true,
  dropLatitude: true,
  dropLongitude: true,
  status: true,
  isAttended: true,
  attendedAt: true,
  attendanceMethod: true,
  attendanceDistanceMeters: true,
  cancellationReason: true,
  createdAt: true,
  updatedAt: true
};

// --------------------------------------------------
// CREATE BOOKING
// POST /api/bookings
// --------------------------------------------------

export const createBooking = async (req, res, next) => {
  try {
    const {
      rideId,
      seatsBooked = 1,
      pickupAddress,
      pickupLatitude,
      pickupLongitude,
      dropAddress,
      dropLatitude,
      dropLongitude
    } = req.body;

    // ----------------------------------------------
    // Validate request
    // ----------------------------------------------

    if (
      !rideId ||
      !pickupAddress ||
      pickupLatitude === undefined ||
      pickupLongitude === undefined ||
      !dropAddress ||
      dropLatitude === undefined ||
      dropLongitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'All booking fields must be provided'
      });
    }

    const requestedSeats = Number(seatsBooked);

    if (
      !Number.isInteger(requestedSeats) ||
      requestedSeats < 1
    ) {
      return res.status(400).json({
        success: false,
        message: 'seatsBooked must be a positive integer'
      });
    }

    // ----------------------------------------------
    // Transaction
    // ----------------------------------------------

    const booking = await prisma.$transaction(async (tx) => {
      // --------------------------------------------
      // Get ride
      // --------------------------------------------

      const ride = await tx.ride.findUnique({
        where: {
          id: rideId
        },
        select: {
          id: true,
          driverId: true,
          availableSeats: true,
          pricePerSeat: true,
          totalTripCost: true,
          pricePerKm: true,
          originLatitude: true,
          originLongitude: true,
          destinationLatitude: true,
          destinationLongitude: true,
          status: true
        }
      });

      if (!ride) {
        const error = new Error('Ride not found');
        error.statusCode = 404;
        throw error;
      }

      // --------------------------------------------
      // Prevent driver booking own ride
      // --------------------------------------------

      if (ride.driverId === req.user.userId) {
        const error = new Error(
          'You cannot book your own ride'
        );

        error.statusCode = 400;
        throw error;
      }

      // --------------------------------------------
      // Check ride status
      // --------------------------------------------

      if (ride.status !== 'SCHEDULED') {
        const error = new Error(
          'This ride is not available for booking'
        );

        error.statusCode = 400;
        throw error;
      }

      // --------------------------------------------
      // Check available seats
      // --------------------------------------------

      if (ride.availableSeats < requestedSeats) {
        const error = new Error(
          `Only ${ride.availableSeats} seat(s) are available`
        );

        error.statusCode = 400;
        throw error;
      }

      // --------------------------------------------
      // Prevent duplicate active booking
      // --------------------------------------------

      const existingBooking =
        await tx.booking.findUnique({
          where: {
            rideId_passengerId: {
              rideId,
              passengerId: req.user.userId
            }
          }
        });

      if (
        existingBooking &&
        ['PENDING', 'ACCEPTED'].includes(
          existingBooking.status
        )
      ) {
        const error = new Error(
          'You already have an active booking for this ride'
        );

        error.statusCode = 409;
        throw error;
      }

      // --------------------------------------------
      // Route compatibility validation
      // --------------------------------------------

      const pickupLat = Number(pickupLatitude);
      const pickupLon = Number(pickupLongitude);
      const dropLat = Number(dropLatitude);
      const dropLon = Number(dropLongitude);

      const routeCheck = validateRouteCompatibility(
        ride, pickupLat, pickupLon, dropLat, dropLon
      );

      if (!routeCheck.valid) {
        const error = new Error(routeCheck.reason);
        error.statusCode = 400;
        throw error;
      }

      // --------------------------------------------
      // Distance-based fare calculation
      // Uses OSRM driving distance, fallback to
      // haversine × 1.3 winding factor.
      // Formula: max(₹10, distance × pricePerKm) × seats
      // Capped at totalTripCost per seat.
      // --------------------------------------------

      const fareResult = await calculatePassengerFare(
        ride, pickupLat, pickupLon, dropLat, dropLon, requestedSeats
      );

      const roundedFare = fareResult.fare;
      const passengerDistanceKm = fareResult.distanceKm;

      // --------------------------------------------
      // Create booking
      // --------------------------------------------

      const newBooking =
        await tx.booking.create({
          data: {
            rideId,
            passengerId: req.user.userId,
            seatsBooked: requestedSeats,

            fareContributionTotal:
              roundedFare,

            distanceKm: passengerDistanceKm,

            pickupAddress:
              pickupAddress.trim(),

            pickupLatitude:
              Number(pickupLatitude),

            pickupLongitude:
              Number(pickupLongitude),

            dropAddress:
              dropAddress.trim(),

            dropLatitude:
              Number(dropLatitude),

            dropLongitude:
              Number(dropLongitude),

            status: 'PENDING'
          },

          select: bookingSelect
        });

      // --------------------------------------------
      // Reserve seats
      // --------------------------------------------

      const updateResult = await tx.ride.updateMany({
        where: {
          id: rideId,
          availableSeats: {
            gte: requestedSeats
          }
        },
        data: {
          availableSeats: {
            decrement: requestedSeats
          }
        }
      });

      if (updateResult.count === 0) {
        const error = new Error('Seats became unavailable while booking');
        error.statusCode = 409;
        throw error;
      }

      // --------------------------------------------
      // Send Notification to Driver
      // --------------------------------------------

      const passenger = await tx.user.findUnique({
        where: { id: req.user.userId },
        select: { name: true, phone: true }
      });
      const passengerName = passenger?.name || 'A passenger';

      await tx.notification.create({
        data: {
          recipientId: ride.driverId,
          senderId: req.user.userId,
          type: 'RIDE_REQUEST_RECEIVED',
          title: 'New Ride Request',
          message: `${passengerName} requested ${requestedSeats} seat(s) (Pickup: ${pickupAddress.trim()}, Drop: ${dropAddress.trim()}).`,
          metadata: {
            bookingId: newBooking.id,
            rideId,
            seatsBooked: requestedSeats,
            fareContributionTotal: roundedFare,
            passengerName,
            passengerPhone: passenger?.phone || null,
            pickupAddress: pickupAddress.trim(),
            dropAddress: dropAddress.trim()
          }
        }
      });

      return newBooking;
    });

    // ----------------------------------------------
    // Response
    // ----------------------------------------------

    return res.status(201).json({
      success: true,
      message: 'Booking request created successfully',
      booking
    });

  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------
// GET MY BOOKINGS
// GET /api/bookings/my
// --------------------------------------------------

export const getMyBookings = async (
  req,
  res,
  next
) => {
  try {
    const bookings =
      await prisma.booking.findMany({
        where: {
          passengerId: req.user.userId
        },

        orderBy: {
          createdAt: 'desc'
        },

        select: {
          ...bookingSelect,

          ride: {
            select: {
              id: true,
              originAddress: true,
              destinationAddress: true,
              departureTime: true,
              status: true,
              pricePerSeat: true,
              totalTripCost: true,
              pricePerKm: true,

              driver: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                  driverRatingAvg: true
                }
              },

              vehicle: {
                select: {
                  make: true,
                  model: true,
                  color: true,
                  vehicleType: true
                }
              }
            }
          }
        }
      });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });

  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------
// GET BOOKING BY ID
// GET /api/bookings/:id
// --------------------------------------------------

export const getBookingById = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const booking =
      await prisma.booking.findUnique({
        where: {
          id
        },

        select: {
          ...bookingSelect,

          ride: {
            select: {
              id: true,
              driverId: true,
              originAddress: true,
              originLandmark: true,
              destinationAddress: true,
              destinationLandmark: true,
              departureTime: true,
              totalSeats: true,
              availableSeats: true,
              pricePerSeat: true,
              totalTripCost: true,
              pricePerKm: true,
              status: true,

              driver: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                  driverRatingAvg: true
                }
              },

              vehicle: {
                select: {
                  make: true,
                  model: true,
                  color: true,
                  plateNumber: true,
                  vehicleType: true
                }
              }
            }
          }
        }
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const isPassenger =
      booking.passengerId === req.user.userId;

    const isDriver =
      booking.ride.driverId === req.user.userId;

    if (!isPassenger && !isDriver) {
      return res.status(403).json({
        success: false,
        message:
          'You are not authorized to view this booking'
      });
    }

    return res.status(200).json({
      success: true,
      booking
    });

  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------
// UPDATE BOOKING STATUS
// PATCH /api/bookings/:id/status
// --------------------------------------------------

export const updateBookingStatus = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (
      !['ACCEPTED', 'REJECTED'].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Status must be ACCEPTED or REJECTED'
      });
    }

    const booking =
      await prisma.booking.findUnique({
        where: {
          id
        },

        include: {
          ride: {
            select: {
              driverId: true
            }
          }
        }
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (
      booking.ride.driverId !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Only the ride driver can update booking status'
      });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message:
          'Only pending bookings can be updated'
      });
    }

    const updatedBooking =
      await prisma.$transaction(
        async (tx) => {

          const updated =
            await tx.booking.update({
              where: {
                id
              },

              data: {
                status
              },

              select: bookingSelect
            });

          // Return reserved seats when rejected.
          if (status === 'REJECTED') {
            await tx.ride.update({
              where: {
                id: booking.rideId
              },

              data: {
                availableSeats: {
                  increment:
                    booking.seatsBooked
                }
              }
            });
          }

          // --------------------------------------------
          // Send Notification to Passenger
          // --------------------------------------------

          await tx.notification.create({
            data: {
              recipientId: booking.passengerId,
              senderId: req.user.userId,
              type: status === 'ACCEPTED' ? 'REQUEST_ACCEPTED' : 'REQUEST_REJECTED',
              title: status === 'ACCEPTED' ? 'Booking Accepted' : 'Booking Rejected',
              message: status === 'ACCEPTED' ? 'Your booking request was accepted.' : 'Your booking request was rejected.',
              metadata: { bookingId: id, rideId: booking.rideId }
            }
          });

          return updated;
        }
      );

    return res.status(200).json({
      success: true,

      message:
        status === 'ACCEPTED'
          ? 'Booking accepted successfully'
          : 'Booking rejected successfully',

      booking: updatedBooking
    });

  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------
// CANCEL BOOKING
// DELETE /api/bookings/:id
// --------------------------------------------------

export const cancelBooking = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const booking =
      await prisma.booking.findUnique({
        where: {
          id
        },
        include: {
          ride: {
            select: { driverId: true }
          }
        }
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (
      booking.passengerId !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message:
          'You can only cancel your own bookings'
      });
    }

    if (
      !['PENDING', 'ACCEPTED'].includes(
        booking.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'This booking cannot be cancelled'
      });
    }

    const cancelledBooking =
      await prisma.$transaction(
        async (tx) => {

          const updated =
            await tx.booking.update({
              where: {
                id
              },

              data: {
                status: 'CANCELLED_PASSENGER',

                cancellationReason:
                  cancellationReason?.trim() ||
                  'Cancelled by passenger'
              },

              select: bookingSelect
            });

          await tx.ride.update({
            where: {
              id: booking.rideId
            },

            data: {
              availableSeats: {
                increment:
                  booking.seatsBooked
              }
            }
          });

          // --------------------------------------------
          // Send Notification to Driver
          // --------------------------------------------

          await tx.notification.create({
            data: {
              recipientId: booking.ride.driverId,
              senderId: req.user.userId,
              type: 'RIDE_CANCELLED',
              title: 'Booking Cancelled',
              message: 'A passenger has cancelled their booking.',
              metadata: { bookingId: id, rideId: booking.rideId }
            }
          });

          return updated;
        }
      );

    return res.status(200).json({
      success: true,
      message:
        'Booking cancelled successfully',
      booking: cancelledBooking
    });

  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------
// GET BOOKING QUOTE
// POST /api/bookings/quote
// --------------------------------------------------

export const getBookingQuote = async (req, res, next) => {
  try {
    const {
      rideId,
      seatsBooked = 1,
      pickupLatitude,
      pickupLongitude,
      dropLatitude,
      dropLongitude
    } = req.body;

    if (
      !rideId ||
      pickupLatitude === undefined ||
      pickupLongitude === undefined ||
      dropLatitude === undefined ||
      dropLongitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'rideId, pickup and drop coordinates are required'
      });
    }

    const requestedSeats = Number(seatsBooked);
    if (!Number.isInteger(requestedSeats) || requestedSeats < 1) {
      return res.status(400).json({
        success: false,
        message: 'seatsBooked must be a positive integer'
      });
    }

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      select: {
        id: true,
        availableSeats: true,
        pricePerSeat: true,
        totalTripCost: true,
        pricePerKm: true,
        originLatitude: true,
        originLongitude: true,
        destinationLatitude: true,
        destinationLongitude: true,
        status: true
      }
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    if (ride.status !== 'SCHEDULED') {
      return res.status(400).json({
        success: false,
        message: 'This ride is not available for booking'
      });
    }

    if (ride.availableSeats < requestedSeats) {
      return res.status(400).json({
        success: false,
        message: `Only ${ride.availableSeats} seat(s) available`
      });
    }

    const pickupLat = Number(pickupLatitude);
    const pickupLon = Number(pickupLongitude);
    const dropLat = Number(dropLatitude);
    const dropLon = Number(dropLongitude);

    // Validate route compatibility
    const routeCheck = validateRouteCompatibility(
      ride, pickupLat, pickupLon, dropLat, dropLon
    );

    if (!routeCheck.valid) {
      return res.status(400).json({
        success: false,
        message: routeCheck.reason
      });
    }

    // Calculate fare
    const quote = await calculatePassengerFare(
      ride, pickupLat, pickupLon, dropLat, dropLon, requestedSeats
    );

    return res.status(200).json({
      success: true,
      quote
    });

  } catch (error) {
    next(error);
  }
};
