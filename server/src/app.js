import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { ENV } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import organizationsRoutes from './routes/organizations.routes.js';
import vehiclesRoutes from './routes/vehicles.routes.js';
import ridesRoutes from './routes/rides.routes.js';
import bookingsRoutes from './routes/bookings.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Security Headers
app.use(helmet());

// Rate Limiting (100 requests per 15 minutes per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  }
});
app.use('/api', apiLimiter);

// Cross-Origin Resource Sharing
app.use(cors({
  origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logger
if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'CoRide API',
    tagline: 'Enterprise & Campus Carpooling Platform',
    status: 'ONLINE',
    health: '/api/health'
  });
});

// Health check endpoint (GET /api/health)
app.use('/api/health', healthRoutes);

// Core API Route Groups (all prefixed with /api)
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/rides', ridesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationsRoutes);

// Fallback 404 & Centralized Error Handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
