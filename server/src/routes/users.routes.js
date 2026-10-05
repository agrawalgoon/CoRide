import { Router } from 'express';
import { getMe } from '../controllers/users.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Protected profile route: GET /api/users/me
router.get('/me', authenticateToken, getMe);

// Placeholder status route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CoRide Users API'
  });
});

export default router;
