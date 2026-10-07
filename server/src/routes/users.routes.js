import { Router } from 'express';
import {
  getMe,
  linkOrganization,
  requestOrganizationOtp,
  verifyOrganizationOtp
} from '../controllers/users.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  requestOtpSchema,
  verifyOtpSchema
} from '../validators/user.validator.js';

const router = Router();

// Protected profile route: GET /api/users/me
router.get('/me', authenticateToken, getMe);

// Organization linking: POST /api/users/organization
router.post('/organization', authenticateToken, linkOrganization);

// Request email verification OTP: POST /api/users/organization/request-otp
router.post(
  '/organization/request-otp',
  authenticateToken,
  validate(requestOtpSchema),
  requestOrganizationOtp
);

// Verify email verification OTP: POST /api/users/organization/verify-otp
router.post(
  '/organization/verify-otp',
  authenticateToken,
  validate(verifyOtpSchema),
  verifyOrganizationOtp
);

// Placeholder status route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CoRide Users API'
  });
});

export default router;
