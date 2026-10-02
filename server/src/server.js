import app from './app.js';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';

const startServer = async () => {
  console.log('--------------------------------------------------');
  console.log(`Starting CoRide API Server [${ENV.NODE_ENV}]...`);
  console.log('--------------------------------------------------');

  // Attempt database connection
  await connectDB();

  const server = app.listen(ENV.PORT, () => {
    console.log(`[HTTP] CoRide server listening on http://localhost:${ENV.PORT}`);
    console.log(`[HTTP] Health check: http://localhost:${ENV.PORT}/api/v1/health`);
    console.log('--------------------------------------------------');
  });

  const gracefulShutdown = (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
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
