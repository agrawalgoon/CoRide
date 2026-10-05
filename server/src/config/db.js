import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { ENV } from './env.js';

// Prevent multiple PrismaClient instances during development/hot reload
const globalForPrisma = globalThis;

const createPrismaClient = () => {
  const url = new URL(ENV.DATABASE_URL);

  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    connectionLimit: 5,
    connectTimeout: 10000
  });

  return new PrismaClient({
    adapter,
    log: ENV.NODE_ENV === 'development'
      ? ['warn', 'error']
      : ['error']
  });
};

export const prisma =
  globalForPrisma.prisma || createPrismaClient();

if (ENV.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

let isConnected = false;

/**
 * Check whether Prisma can communicate with MySQL.
 */
export const checkDBConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    isConnected = true;
    return true;
  } catch (error) {
    isConnected = false;

    console.error(
      '[MySQL] Connection check failed:',
      error.message
    );

    return false;
  }
};

/**
 * Initial database connection check.
 */
export const connectDB = async () => {
  const connected = await checkDBConnection();

  if (connected) {
    console.log(
      '[MySQL] Connected successfully to MySQL 8 database via Prisma 7.'
    );
  } else {
    console.warn(
      '[MySQL] Database connection attempt failed.'
    );
  }

  return connected;
};

/**
 * Current database status.
 */
export const getDBStatus = () => ({
  type: 'MySQL 8 (Prisma 7 ORM)',
  status: isConnected ? 'connected' : 'disconnected',
  isLive: isConnected
});