import crypto from 'crypto';

const EARTH_RADIUS_METERS = 6371000;

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
 * Generate a random TOTP-style secret (hex, 32 chars).
 * Stored in ride.activeTotpSecret (hashed / server-side only).
 */
export const generateTotpSecret = () => crypto.randomBytes(16).toString('hex');

/**
 * Derive a time-bounded OTP token from the secret.
 * The token rotates every windowSeconds (default 90s).
 * Only the server that stores the secret can re-derive the same token —
 * so the frontend never receives the raw secret, only the short token.
 *
 * Token = first 8 hex chars of HMAC-SHA256(secret + timeWindow).
 */
export const deriveTotpToken = (secret, windowSeconds = 90) => {
  const window = Math.floor(Date.now() / 1000 / windowSeconds);
  return crypto
    .createHmac('sha256', secret)
    .update(String(window))
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();
};

/**
 * Hash a value for audit-safe storage (no raw secrets in DB).
 */
export const sha256 = (value) =>
  crypto.createHash('sha256').update(value).digest('hex');
