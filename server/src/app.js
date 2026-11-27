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

import {
  errorHandler,
  notFoundHandler
} from './middleware/errorHandler.js';

const app = express();

// Trust reverse proxy (Render, Vercel, Cloudflare) for rate limiting & secure cookies
app.set('trust proxy', 1);

/* =========================================================
   CORS
   =========================================================
   Development configuration:
   Allows the React/Vite frontend to communicate with
   the Express backend from localhost or another dev port.
   ========================================================= */

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS'
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ]
  })
);

/* =========================================================
   SECURITY HEADERS
   ========================================================= */

app.use(helmet());

/* =========================================================
   RATE LIMITING
   ========================================================= */

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    error: {
      message:
        'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  }
});

app.use('/api', apiLimiter);

/* =========================================================
   REQUEST BODY PARSING
   ========================================================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================================================
   HTTP REQUEST LOGGER
   ========================================================= */

if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

/* =========================================================
   ROOT ENDPOINT
   ========================================================= */

app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'CoRide API',
    tagline: 'Enterprise & Campus Carpooling Platform',
    status: 'ONLINE',
    health: '/api/health'
  });
});

/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.use('/api/health', healthRoutes);

/* =========================================================
   API ROUTES
   ========================================================= */

app.use('/api/auth', authRoutes);

app.use('/api/users', usersRoutes);

app.use('/api/organizations', organizationsRoutes);

app.use('/api/vehicles', vehiclesRoutes);

app.use('/api/rides', ridesRoutes);

app.use('/api/bookings', bookingsRoutes);

app.use('/api/attendance', attendanceRoutes);

app.use('/api/notifications', notificationsRoutes);

/* =========================================================
   404 HANDLER
   ========================================================= */

app.use(notFoundHandler);

/* =========================================================
   GLOBAL ERROR HANDLER
   ========================================================= */

app.use(errorHandler);

export default app;