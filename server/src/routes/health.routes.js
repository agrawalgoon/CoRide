import { Router } from 'express';
import { checkDBConnection } from '../config/db.js';

const router = Router();

/**
 * Health check handler verifying both API server status and Prisma/MySQL connectivity.
 */
const handleHealthCheck = async (req, res) => {
  const isDbConnected = await checkDBConnection(2500);

  if (!isDbConnected) {
    return res.status(503).json({
      success: false,
      message: 'CoRide API is running',
      database: 'unavailable'
    });
  }

  return res.status(200).json({
    success: true,
    message: 'CoRide API is running',
    database: 'connected'
  });
};

// Supports both direct /api/health or sub-router mounting
router.get('/health', handleHealthCheck);
router.get('/', handleHealthCheck);

export default router;
