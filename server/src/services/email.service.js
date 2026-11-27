import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';

/**
 * CoRide Real Email Delivery Service
 *
 * Supports three delivery providers:
 * 1. 'resend': Uses the official Resend REST API via native fetch (no extra npm packages required).
 *    Free tier offers 3,000 emails/month (100 emails/day) without billing/credit card.
 * 2. 'smtp': Native SMTP delivery over TLS/STARTTLS sockets without external dependencies.
 * 3. 'console': Safe mock transport for offline/local development that logs email contents.
 *
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.userName - Recipient full name
 * @param {string} params.otp - Plain 6-digit OTP code
 * @param {number} [params.expiresInMinutes=10] - OTP expiration in minutes
 * @returns {Promise<{ delivered: boolean, provider: string, id?: string }>}
 */
export const sendVerificationOtpEmail = async ({
  to,
  userName,
  otp,
  expiresInMinutes = 10
}) => {
  const provider = (ENV.EMAIL_PROVIDER || 'console').toLowerCase();
  const subject = 'CoRide Campus Email Verification Code';
  const recipientName = userName || 'User';

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #059669; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">CoRide</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Campus & Corporate Carpooling Platform</p>
      </div>
      <div style="padding: 20px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
        <p style="color: #334155; font-size: 16px; margin: 0 0 12px 0;">Hello <strong>${recipientName}</strong>,</p>
        <p style="color: #475569; font-size: 15px; line-height: 1.5; margin: 0 0 20px 0;">
          Use the 6-digit verification code below to verify your organization email and complete your CoRide campus access setup:
        </p>
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #047857; font-family: monospace;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0;">
          This code is valid for <strong>${expiresInMinutes} minutes</strong> and can only be used once. If you did not request this code, you can safely ignore this email.
        </p>
      </div>
      <div style="margin-top: 20px; text-align: center;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} CoRide. Eco-friendly, secure carpooling.</p>
      </div>
    </div>
  `;

  const textContent = `Hello ${recipientName},\n\nYour CoRide verification code is: ${otp}\nThis code is valid for ${expiresInMinutes} minutes.\n\nIf you did not request this, please ignore this message.\n\n- The CoRide Team`;

  // 1. Resend Provider (Zero-dependency HTTP POST)
  if (provider === 'resend') {
    if (!ENV.RESEND_API_KEY) {
      const err = new Error('RESEND_API_KEY is not configured in environment variables');
      err.code = 'EMAIL_CONFIG_ERROR';
      throw err;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ENV.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: ENV.EMAIL_FROM,
        to: [to],
        subject,
        html: htmlContent,
        text: textContent
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.message || data?.error?.message || `Resend API returned HTTP ${response.status}`;
      const err = new Error(`Email delivery rejected by Resend: ${errorMsg}`);
      err.statusCode = 502;
      err.code = 'EMAIL_DELIVERY_FAILED';
      err.details = data;
      throw err;
    }

    return { delivered: true, provider: 'resend', id: data?.id };
  }

  // 2. SMTP Provider (e.g. Gmail SMTP)
  if (provider === 'smtp') {
    if (!ENV.SMTP_USER || !ENV.SMTP_PASS) {
      const err = new Error('Incomplete SMTP configuration (SMTP_USER or SMTP_PASS missing)');
      err.code = 'EMAIL_CONFIG_ERROR';
      throw err;
    }

    const host = ENV.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(ENV.SMTP_PORT) || 465;
    const secure = ENV.SMTP_SECURE !== false && (ENV.SMTP_SECURE === true || port === 465);

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASS
      }
    });

    const info = await transporter.sendMail({
      from: ENV.EMAIL_FROM || `"CoRide" <${ENV.SMTP_USER}>`,
      to,
      subject,
      text: textContent,
      html: htmlContent
    });

    return { delivered: true, provider: 'smtp', id: info.messageId };
  }


  // 3. Fallback: Console Transport (Safe Development / Offline Mode)
  if (ENV.NODE_ENV !== 'production' || provider === 'console') {
    console.log('==================================================');
    console.log('[EmailService] Simulated Email Delivery (DEV/CONSOLE)');
    console.log(`[EmailService] To: ${to}`);
    console.log(`[EmailService] Recipient: ${recipientName}`);
    console.log(`[EmailService] Subject: ${subject}`);
    console.log(`[EmailService] OTP: ${otp} (valid for ${expiresInMinutes} minutes)`);
    console.log('==================================================');
    return { delivered: true, provider: 'console' };
  }

  // If in production and provider is unrecognized
  const err = new Error(`Unsupported or unconfigured email provider: ${provider}`);
  err.statusCode = 500;
  err.code = 'EMAIL_PROVIDER_UNCONFIGURED';
  throw err;
};
