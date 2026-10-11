import app from './app.js';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { syncUpcomingRecurringRides } from './services/recurring/recurring.service.js';

const startServer = async () => {
  console.log('--------------------------------------------------');
  console.log(`Starting CoRide API Server [${ENV.NODE_ENV}]...`);
  console.log('--------------------------------------------------');

  // Attempt database connection (non-fatal if temporarily offline)
  await connectDB();

  // Run initial recurring ride sync on boot (idempotent)
  try {
    const syncSummary = await syncUpcomingRecurringRides();
    console.log('[RecurringRide] Boot sync completed:', syncSummary);
  } catch (syncErr) {
    console.warn('[RecurringRide] Boot sync warning:', syncErr.message);
  }

  // Periodic in-process sync timer (every 6 hours)
  const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;
  const syncTimer = setInterval(async () => {
    try {
      await syncUpcomingRecurringRides();
    } catch (err) {
      console.warn('[RecurringRide] Background sync warning:', err.message);
    }
  }, SYNC_INTERVAL_MS);

  const server = app.listen(ENV.PORT, () => {
    console.log(`[HTTP] CoRide server listening on http://localhost:${ENV.PORT}`);
    console.log(`[HTTP] Health check: http://localhost:${ENV.PORT}/api/health`);
    console.log('--------------------------------------------------');
  });

  const gracefulShutdown = (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    clearInterval(syncTimer);
    server.close(() => {
      console.log('CoRide HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
