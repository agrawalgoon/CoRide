import { Router } from 'express';

const router = Router();

// Placeholder for notification endpoints (list notifications, mark as read)
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CoRide Notifications API placeholder'
  });
});

export default router;
