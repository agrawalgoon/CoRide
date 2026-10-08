import api from './api';

export const getRides = async (filters = {}) => {
  const query = new URLSearchParams(filters).toString();
  const response = await api.get(`/rides?${query}`);
  return response.data;
};

export const getRideById = async (rideId) => {
  const response = await api.get(`/rides/${rideId}`);
  return response.data;
};

export const createRide = async (rideData) => {
  const response = await api.post('/rides', rideData);
  return response.data;
};

export const updateRide = async (rideId, rideData) => {
  const response = await api.put(`/rides/${rideId}`, rideData);
  return response.data;
};

export const cancelRide = async (rideId) => {
  const response = await api.delete(`/rides/${rideId}`);
  return response.data;
};
