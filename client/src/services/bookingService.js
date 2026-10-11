import api from './api';

export const createBooking = async (bookingData) => {
  const response = await api.post('/bookings', bookingData);
  return response.data?.booking || response.data;
};

export const getBookingQuote = async (quoteData) => {
  const response = await api.post('/bookings/quote', quoteData);
  return response.data?.quote || response.data;
};

export const getMyBookings = async () => {
  const response = await api.get('/bookings/my');
  return response.data?.bookings || [];
};

export const getBookingById = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return response.data?.booking || response.data;
};

export const updateBookingStatus = async (id, status) => {
  const response = await api.patch(`/bookings/${id}/status`, { status });
  return response.data?.booking || response.data;
};

export const cancelBooking = async (id, cancellationReason) => {
  const response = await api.delete(`/bookings/${id}`, {
    data: { cancellationReason }
  });
  return response.data?.booking || response.data;
};
