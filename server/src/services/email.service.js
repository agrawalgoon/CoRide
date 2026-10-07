import { ENV } from '../config/env.js';

/**
 * Service to handle sending verification emails.
 * Uses development console logging when no external email transport is configured,
 * structured to allow seamless integration with SMTP, Resend, or SendGrid later.
 *
 * @param {Object} params
 * @param {string} params.to - Recipient organization email address
 * @param {string} params.userName - Full name of the user
 * @param {string} params.otp - Plain 6-digit OTP code
 * @param {number} [params.expiresInMinutes=10] - OTP expiration duration in minutes
 * @returns {Promise<boolean>}
 */
export const sendVerificationOtpEmail = async ({
  to,
  userName,
  otp,
  expiresInMinutes = 10
}) => {
  if (ENV.NODE_ENV !== 'production') {
    console.log('==================================================');
    console.log('[EmailService] Simulated Email Delivery (DEV)');
    console.log(`[EmailService] To: ${to}`);
    console.log(`[EmailService] Recipient: ${userName || 'User'}`);
    console.log(`[EmailService] Subject: CoRide Campus Email Verification Code`);
    console.log(`[EmailService] OTP: ${otp} (valid for ${expiresInMinutes} minutes)`);
    console.log('==================================================');
  }

  // Future integration point for production mail providers (Nodemailer, SendGrid, Resend)
  // if (ENV.NODE_ENV === 'production') { ... }

  return true;
};
