import api from './api';

export const getOrganizations = async () => {
  const response = await api.get('/organizations');
  return response.data;
};

export const linkOrganization = async (organizationId, orgEmail) => {
  const response = await api.post('/users/organization', { organizationId, orgEmail });
  return response.data;
};

export const requestOrganizationOtp = async () => {
  const response = await api.post('/users/organization/request-otp');
  return response.data;
};

export const verifyOrganizationOtp = async (otp) => {
  const response = await api.post('/users/organization/verify-otp', { otp });
  return response.data;
};
