import api from './api';
import { mockCreateBooking } from './mockApi';

export const createBooking = async (rideId, bookingData) => {
  // TODO: The backend currently only has a placeholder for /bookings.
  // When the backend endpoint is ready, uncomment the lines below and remove the mock function.
  
  // const response = await api.post('/bookings', { rideId, ...bookingData });
  // return response.data;
  
  console.warn('[MOCK] Using mockCreateBooking because backend endpoint is not implemented');
  return mockCreateBooking(rideId, bookingData);
};
