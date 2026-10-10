import api from './api';

export const getRideById = async (rideId) => {
  const response = await api.get(`/rides/${rideId}`);
  return response.data;
};

// API contract for these operations does not exist yet.
// We expose them but they will throw or return unavailable state.
export const startRide = async (rideId) => {
  throw new Error("API_NOT_SUPPORTED");
};

export const completeRide = async (rideId) => {
  throw new Error("API_NOT_SUPPORTED");
};

export const cancelRide = async (rideId) => {
  const response = await api.delete(`/rides/${rideId}`);
  return response.data;
};
