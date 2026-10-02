import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ENV } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Security Headers
app.use(helmet());

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
    tagline: 'Campus & Corporate Carpooling Platform',
    status: 'ONLINE',
    documentation: '/api/v1/health'
  });
});

// Primary Health Check Route
app.use('/api/v1', healthRoutes);

// Fallback 404 & Error Handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
