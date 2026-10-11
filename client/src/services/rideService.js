import api from './api';

export const getRides = async (params) => {
  const response = await api.get('/rides', { params });
  return response.data?.rides || [];
};

export const getMyRides = async () => {
  const response = await api.get('/rides/my');
  return response.data?.rides || [];
};

export const getRideById = async (id) => {
  const response = await api.get(`/rides/${id}`);
  return response.data?.ride || response.data;
};

export const createRide = async (rideData) => {
  const response = await api.post('/rides', rideData);
  return response.data?.ride || response.data;
};

export const updateRide = async (id, rideData) => {
  const response = await api.put(`/rides/${id}`, rideData);
  return response.data?.ride || response.data;
};

export const deleteRide = async (id) => {
  const response = await api.delete(`/rides/${id}`);
  return response.data;
};

export const getMatches = async (params) => {
  const response = await api.get('/rides/matches', { params });
  return response.data?.matches || [];
};
