import api from './api';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const verifyOrganizationOtp = async (otp) => {
  const response = await api.post('/users/organization/verify-otp', { otp });
  return response.data;
};

export const requestOrganizationOtp = async (organizationId) => {
  const response = await api.post('/users/organization/request-otp', { organizationId });
  return response.data;
};
