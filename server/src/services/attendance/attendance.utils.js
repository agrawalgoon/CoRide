import crypto from 'crypto';
import { ENV } from '../../config/env.js';

const EARTH_RADIUS_METERS = 6371000;
export const MAX_REASONABLE_ACCURACY_METERS = 200; // Flag or adjust if GPS error > 200m

/**
 * Haversine distance between two lat/lon points.
 * Returns distance in metres.
 */
export const distanceMeters = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Check if a location is within a geofence, factoring in GPS accuracy limits.
 */
export const checkGeofence = (
  targetLat,
  targetLon,
  currentLat,
  currentLon,
  radiusMeters,
  accuracyMeters = 0
) => {
  if (
    targetLat === undefined ||
    targetLon === undefined ||
    currentLat === undefined ||
    currentLon === undefined ||
    targetLat === null ||
    targetLon === null ||
    currentLat === null ||
    currentLon === null
  ) {
    return {
      valid: false,
      rawDistanceMeters: null,
      effectiveDistanceMeters: null,
      accuracyMeters: null,
      radiusMeters
    };
  }

  const rawDist = distanceMeters(targetLat, targetLon, currentLat, currentLon);
  const acc = Number.isFinite(Number(accuracyMeters)) ? Math.max(0, Number(accuracyMeters)) : 0;

  // Account for GPS inaccuracy: if radius is 150m and distance is 170m with +/- 30m accuracy,
  // effective distance is max(0, 170 - 30) = 140m <= 150m (valid within margin)
  // But cap accuracy credit to prevent spoofing with huge simulated accuracy
  const allowableAccuracyCredit = Math.min(acc, 50);
  const effectiveDist = Math.max(0, rawDist - allowableAccuracyCredit);

  return {
    valid: effectiveDist <= radiusMeters,
    rawDistanceMeters: Math.round(rawDist),
    effectiveDistanceMeters: Math.round(effectiveDist),
    accuracyMeters: Math.round(acc),
    radiusMeters
  };
};

/**
 * Generate a random TOTP-style secret (hex, 32 chars).
 * Stored in ride.activeTotpSecret (server-side only).
 */
export const generateTotpSecret = () => crypto.randomBytes(16).toString('hex');

/**
 * Derive a time-bounded OTP token from the secret.
 * The token rotates every windowSeconds (default 90s).
 */
export const deriveTotpToken = (secret, windowSeconds = 90, offsetWindows = 0) => {
  const currentWindow = Math.floor(Date.now() / 1000 / windowSeconds);
  const targetWindow = currentWindow + offsetWindows;
  return crypto
    .createHmac('sha256', secret)
    .update(String(targetWindow))
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();
};

/**
 * Verify a submitted TOTP token against current and previous windows (for clock drift).
 */
export const verifyTotpToken = (token, secret, windowSeconds = 90) => {
  if (!token || !secret) return false;
  const cleanToken = String(token).trim().toUpperCase();
  const current = deriveTotpToken(secret, windowSeconds, 0);
  const prev = deriveTotpToken(secret, windowSeconds, -1);
  return cleanToken === current || cleanToken === prev;
};

/**
 * Hash a value for audit-safe storage & single-use replay prevention.
 */
export const sha256 = (value) =>
  crypto.createHash('sha256').update(String(value)).digest('hex');

/**
 * Generate a short-lived, signed, dynamic QR verification token.
 * Payload includes rideId, optional bookingId, type, issuedAt, expiresAt, and a cryptographic nonce.
 * Signed with HMAC-SHA256 using the server secret + ride secret.
 *
 * @param {Object} payloadData - { rideId, bookingId, passengerId, type }
 * @param {string} rideSecret - Ride's activeTotpSecret
 * @param {number} ttlSeconds - Time-to-live in seconds (default 60s)
 * @returns {string} tokenString - base64Url(payload).signature
 */
export const generateSignedQrToken = (payloadData, rideSecret, ttlSeconds = 60) => {
  const now = Date.now();
  const nonce = crypto.randomBytes(8).toString('hex');
  const payload = {
    ...payloadData,
    iat: now,
    exp: now + ttlSeconds * 1000,
    nonce
  };

  const payloadString = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const key = `${ENV.JWT_SECRET || 'dev_secret_key'}:${rideSecret}`;
  const signature = crypto
    .createHmac('sha256', key)
    .update(payloadString)
    .digest('hex');

  return `${payloadString}.${signature}`;
};

/**
 * Verify and decode a short-lived signed QR token.
 * Validates HMAC signature, expiration time, and returns payload.
 *
 * @param {string} tokenString - base64Url(payload).signature
 * @param {string} rideSecret - Ride's activeTotpSecret
 * @returns {{ valid: boolean, payload?: Object, error?: string, code?: string }}
 */
export const verifySignedQrToken = (tokenString, rideSecret) => {
  if (!tokenString || typeof tokenString !== 'string') {
    return { valid: false, error: 'QR token is missing or invalid format', code: 'TOKEN_MISSING' };
  }

  const parts = tokenString.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed QR token format', code: 'TOKEN_MALFORMED' };
  }

  const [payloadString, signature] = parts;
  const key = `${ENV.JWT_SECRET || 'dev_secret_key'}:${rideSecret}`;
  const expectedSignature = crypto
    .createHmac('sha256', key)
    .update(payloadString)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return { valid: false, error: 'Invalid QR token signature', code: 'SIGNATURE_INVALID' };
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadString, 'base64url').toString('utf8'));
  } catch (err) {
    return { valid: false, error: 'Invalid QR token payload encoding', code: 'PAYLOAD_INVALID' };
  }

  const now = Date.now();
  if (!payload.exp || now > payload.exp) {
    return {
      valid: false,
      error: 'QR token has expired. Please refresh and scan a new code.',
      code: 'TOKEN_EXPIRED',
      payload
    };
  }

  return { valid: true, payload };
};
