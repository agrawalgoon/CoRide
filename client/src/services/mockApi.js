// Mock API implementations for endpoints that are not yet built on the backend.
// This should be removed once the backend endpoints are available.

export const mockCreateBooking = async (rideId, bookingData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate backend behavior
      if (!bookingData.seats || bookingData.seats <= 0) {
        reject(new Error('Invalid number of seats'));
        return;
      }

      // Simulate a successful booking
      resolve({
        success: true,
        message: 'Ride booked successfully',
        booking: {
          id: `mock-booking-${Date.now()}`,
          rideId,
          seats: bookingData.seats,
          pickupLocation: bookingData.pickupLocation,
          dropLocation: bookingData.dropLocation,
          totalFare: bookingData.totalFare,
          status: 'CONFIRMED',
          createdAt: new Date().toISOString()
        }
      });
    }, 1000);
  });
};
