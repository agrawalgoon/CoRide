import { Router } from 'express';

const router = Router();

// Placeholder for ride endpoints (offer ride, search rides, ride details)
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CoRide Rides API placeholder'
  });
});

export default router;
