import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

/**
 * Reusable JWT verification middleware.
 * Verifies Authorization: Bearer <token> header and attaches { userId, role } to req.user.
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication token is required',
        code: 'TOKEN_MISSING'
      }
    });
  }

  const parts = authHeader.trim().split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    return res.status(401).json({
      success: false,
      error: {
        message: "Malformed authorization header. Expected 'Bearer <token>'",
        code: 'TOKEN_MALFORMED'
      }
    });
  }

  const token = parts[1];

  jwt.verify(token, ENV.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication token has expired',
            code: 'TOKEN_EXPIRED'
          }
        });
      }

      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid authentication token',
          code: 'TOKEN_INVALID'
        }
      });
    }

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token payload',
          code: 'TOKEN_PAYLOAD_INVALID'
        }
      });
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role || 'USER'
    };

    next();
  });
};
