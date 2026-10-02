import { Router } from 'express';
import { ENV } from '../config/env.js';
import { prisma, getDBStatus } from '../config/db.js';

const router = Router();

router.get('/health', async (req, res) => {
  let dbLive = false;
  let dbLatencyMs = null;

  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - startTime;
    dbLive = true;
  } catch (err) {
    dbLive = false;
  }

  res.status(200).json({
    success: true,
    service: 'CoRide API Server',
    version: '1.0.0',
    environment: ENV.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      type: 'MySQL 8 (Prisma ORM)',
      status: dbLive ? 'CONNECTED' : 'DISCONNECTED',
      isLive: dbLive,
      latencyMs: dbLatencyMs
    },
    features: {
      findPool: 'READY',
      offerPool: 'READY',
      alerts: 'READY',
      profile: 'READY',
      myRides: 'READY'
    }
  });
});

export default router;
