import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  initiateAttendance,
  getRideQrToken,
  getPassengerBoardingToken,
  verifyQr,
  scanPassengerQr,
  verifyGeofence,
  verifyArrival,
  markNoShow,
  driverOverride,
  getMyAttendance,
  getRideAttendance,
  getOrganizationAttendance
} from '../controllers/attendance.controller.js';

const router = Router();

// All attendance endpoints require valid JWT authentication
router.use(authenticateToken);

// --- DRIVER ENDPOINTS ---
// POST /api/attendance/initiate: Driver activates attendance and gets initial dynamic QR token
router.post('/initiate', initiateAttendance);

// POST /api/attendance/rides/:rideId/start: Start eligible ride and activate attendance session
router.post('/rides/:rideId/start', initiateAttendance);

// GET /api/attendance/rides/:rideId/qr-token: Fetch/refresh current dynamic QR token for active ride
router.get('/rides/:rideId/qr-token', getRideQrToken);
router.post('/rides/:rideId/qr-token', getRideQrToken);

// POST /api/attendance/scan-passenger-qr: Driver scans passenger's boarding pass
router.post('/scan-passenger-qr', scanPassengerQr);

// POST /api/attendance/mark-no-show: Driver marks an unboarded passenger as NO_SHOW
router.post('/mark-no-show', markNoShow);

// POST /api/attendance/driver-override: Driver manually boards passenger (backup/override)
router.post('/driver-override', driverOverride);

// GET /api/attendance/ride/:rideId: Driver views attendance roster and logs for their ride
router.get('/ride/:rideId', getRideAttendance);

// --- PASSENGER ENDPOINTS ---
// POST /api/attendance/passenger-token: Passenger gets dynamic boarding pass QR to show driver
router.post('/passenger-token', getPassengerBoardingToken);

// POST /api/attendance/verify-qr: Passenger scans driver's dynamic QR code to board
router.post('/verify-qr', verifyQr);

// POST /api/attendance/verify-geofence: Passenger pickup geofence check-in
router.post('/verify-geofence', verifyGeofence);

// POST /api/attendance/verify-arrival: Passenger destination geofence arrival verification
router.post('/verify-arrival', verifyArrival);

// GET /api/attendance/my: Passenger views their personal attendance logs
router.get('/my', getMyAttendance);

// --- ADMIN ENDPOINTS ---
// GET /api/attendance/organization/:orgId: Org Admin views attendance & campus compliance
router.get('/organization/:orgId', getOrganizationAttendance);

export default router;
