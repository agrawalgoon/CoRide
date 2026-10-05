import { Router } from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

const router = Router();

// Registration: POST /api/auth/register
router.post('/register', validate(registerSchema), register);

// Login: POST /api/auth/login
router.post('/login', validate(loginSchema), login);

// Placeholder status route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CoRide Auth API (register and login active)'
  });
});

export default router;
