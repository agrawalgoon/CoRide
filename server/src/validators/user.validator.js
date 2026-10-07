import { z } from 'zod';

export const requestOtpSchema = z.object({}).passthrough().optional();

export const verifyOtpSchema = z.object({
  otp: z
    .string({ required_error: 'OTP is required' })
    .trim()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers')
});
