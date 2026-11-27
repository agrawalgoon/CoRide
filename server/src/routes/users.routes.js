import { Router } from 'express';
import {
  getMe,
  linkOrganization,
  requestOrganizationOtp,
  verifyOrganizationOtp,
  getDrivingLicense,
  updateDrivingLicense
} from '../controllers/users.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  requestOtpSchema,
  verifyOtpSchema,
  drivingLicenseSchema
} from '../validators/user.validator.js';

import rateLimit from 'express-rate-limit';

const router = Router();

// Strict rate limiters for OTP security
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many OTP requests from this network. Please try again later.',
    error: {
      message: 'Too many OTP requests from this network. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  }
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many OTP verification attempts. Please wait before trying again.',
    error: {
      message: 'Too many OTP verification attempts. Please wait before trying again.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  }
});

// Protected profile route: GET /api/users/me
router.get('/me', authenticateToken, getMe);

// Driving License: GET /api/users/license and PUT /api/users/license
router.get('/license', authenticateToken, getDrivingLicense);
router.put('/license', authenticateToken, validate(drivingLicenseSchema), updateDrivingLicense);

// Organization linking: POST /api/users/organization
router.post('/organization', authenticateToken, linkOrganization);

// Request email verification OTP: POST /api/users/organization/request-otp
router.post(
  '/organization/request-otp',
  authenticateToken,
  otpRequestLimiter,
  validate(requestOtpSchema),
  requestOrganizationOtp
);

// Verify email verification OTP: POST /api/users/organization/verify-otp
router.post(
  '/organization/verify-otp',
  authenticateToken,
  otpVerifyLimiter,
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
