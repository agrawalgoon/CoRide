import { prisma } from '../config/db.js';

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
      // Passenger distance
      // --------------------------------------------

      const passengerDistanceKm =
        calculateDistanceKm(
          pickupLatitude,
          pickupLongitude,
          dropLatitude,
          dropLongitude
        );

      if (!Number.isFinite(passengerDistanceKm) || passengerDistanceKm <= 0) {
        const error = new Error(
          'Pickup and drop locations must be different'
        );

        error.statusCode = 400;
        throw error;
      }

      // --------------------------------------------
      // Full ride distance
      // --------------------------------------------

      const rideDistanceKm =
        calculateDistanceKm(
          ride.originLatitude,
          ride.originLongitude,
          ride.destinationLatitude,
          ride.destinationLongitude
        );

      if (!Number.isFinite(rideDistanceKm) || rideDistanceKm <= 0) {
        const error = new Error(
          'Ride route distance could not be calculated'
        );

        error.statusCode = 400;
        throw error;
      }

      // --------------------------------------------
      // Total trip cost
      // --------------------------------------------

      const totalTripCost =
        Number(ride.totalTripCost);

      if (
        !Number.isFinite(totalTripCost) ||
        totalTripCost <= 0
      ) {
        const error = new Error(
          'This ride does not have a valid total trip cost'
        );

        error.statusCode = 400;
        throw error;
      }

      // --------------------------------------------
      // Fair distance-based fare
      //
      // Passenger pays according to the portion
      // of the driver's route they actually travel.
      // --------------------------------------------

      const distanceRatio = Math.min(
        passengerDistanceKm / rideDistanceKm,
        1
      );

      const fare =
        totalTripCost *
        distanceRatio *
        requestedSeats;

      const roundedFare =
        Number(fare.toFixed(2));

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

      await tx.notification.create({
        data: {
          recipientId: ride.driverId,
          senderId: req.user.userId,
          type: 'RIDE_REQUEST_RECEIVED',
          title: 'New Ride Request',
          message: `Someone wants to book ${requestedSeats} seat(s) on your ride.`,
          metadata: { bookingId: newBooking.id, rideId }
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