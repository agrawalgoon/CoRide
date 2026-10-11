import { Router } from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../controllers/notifications.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

// GET /api/notifications - List user's notifications
router.get('/', getNotifications);

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', markAllNotificationsRead);

// PATCH /api/notifications/:id/read - Mark one as read
router.patch('/:id/read', markNotificationRead);

export default router;
