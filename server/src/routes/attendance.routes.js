import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  initiateAttendance,
  verifyQr,
  verifyGeofence,
  getMyAttendance,
  getRideAttendance
} from '../controllers/attendance.controller.js';

const router = Router();

// All attendance endpoints require a valid JWT
router.use(authenticateToken);

// POST /api/attendance/initiate
// Driver activates attendance for a ride, gets back a rotating QR token
router.post('/initiate', initiateAttendance);

// POST /api/attendance/verify-qr
// Passenger verifies attendance by submitting the scanned QR token
router.post('/verify-qr', verifyQr);

// POST /api/attendance/verify-geofence
// Passenger verifies attendance purely by location (must be within geofence)
router.post('/verify-geofence', verifyGeofence);

// GET /api/attendance/my
// Authenticated passenger: full attendance history
router.get('/my', getMyAttendance);

// GET /api/attendance/ride/:rideId
// Driver only: attendance summary for one of their rides
router.get('/ride/:rideId', getRideAttendance);

export default router;
