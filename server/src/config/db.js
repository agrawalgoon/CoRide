import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
});

let isConnected = false;

export const connectDB = async () => {
  try {
    // Execute a simple ping query to check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    isConnected = true;
    console.log('[MySQL] Connected successfully to MySQL 8 database via Prisma.');
    return true;
  } catch (error) {
    isConnected = false;
    console.warn(`[MySQL] Database connection notice: ${error.message}`);
    console.warn('[MySQL] Note: Ensure MySQL 8 is running and verify DATABASE_URL in server/.env');
    return false;
  }
};

export const getDBStatus = () => {
  return {
    type: 'MySQL 8 (Prisma ORM)',
    status: isConnected ? 'CONNECTED' : 'DISCONNECTED',
    isLive: isConnected
  };
};
