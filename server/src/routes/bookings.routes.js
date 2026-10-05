import { Router } from 'express';

const router = Router();

// Placeholder for booking endpoints (request booking, accept/reject, cancel)
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CoRide Bookings API placeholder'
  });
});

export default router;
