import api from './api';

// Attendance endpoints are not yet implemented on the backend.
// These mock the service interface to be connected later.

export const generateQrCode = async (rideId) => {
  throw new Error("API_NOT_SUPPORTED");
};

export const verifyAttendanceWithQr = async (rideId, qrToken) => {
  throw new Error("API_NOT_SUPPORTED");
};

export const checkGeofenceStatus = async (rideId, lat, lng) => {
  throw new Error("API_NOT_SUPPORTED");
};
