import { z } from 'zod';

export const requestOtpSchema = z.object({}).passthrough().optional();

export const verifyOtpSchema = z.object({
  otp: z
    .string({ required_error: 'OTP is required' })
    .trim()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers')
});

/**
 * Driving license validation schema
 * Supports standard Indian DL formats (e.g. MH14 20110012345, DL-0420110012345)
 * as well as general standardized driving license alphanumeric formats.
 */
export const drivingLicenseSchema = z.object({
  licenseNumber: z
    .string({ required_error: 'License number is required' })
    .trim()
    .min(8, 'License number must be at least 8 characters')
    .max(25, 'License number cannot exceed 25 characters')
    .regex(/^[A-Z]{2}[0-9A-Z\s\-]{6,23}$/i, 'Invalid driving license format (e.g. MH14 20110012345)'),
  holderName: z
    .string({ required_error: 'License holder name is required' })
    .trim()
    .min(2, 'Holder name must be at least 2 characters')
    .max(150, 'Holder name cannot exceed 150 characters'),
  expiryDate: z
    .string({ required_error: 'License expiry date is required' })
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date > new Date();
    }, 'License expiry date must be a valid future date'),
  dlPhotoUrl: z
    .string()
    .url('Photo URL must be a valid URL')
    .optional()
    .or(z.literal(''))
    .nullable()
});
