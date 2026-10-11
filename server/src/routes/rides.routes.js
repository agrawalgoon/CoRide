import { Router } from 'express';

import {
  createRide,
  getRides,
  getMyRides,
  getRideById,
  updateRide,
  deleteRide,
  startRide,
  getMatches,
  cancelRecurringSeries,
  syncRecurringRides
} from '../controllers/rides.controller.js';

import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Protected: AI matching for passenger
router.get('/matches', authenticateToken, getMatches);

// Protected: sync upcoming recurring ride instances
router.post('/recurring/sync', authenticateToken, syncRecurringRides);

// Protected: cancel entire future recurring series (without bookings)
router.delete('/recurring/:parentId', authenticateToken, cancelRecurringSeries);

// Public: search/list scheduled rides
router.get('/', getRides);

// Protected: driver's own rides
router.get('/my', authenticateToken, getMyRides);

// Protected: offer a new ride
router.post('/', authenticateToken, createRide);

// Public: get ride details
router.get('/:id', getRideById);

// Protected: start eligible ride
router.post('/:id/start', authenticateToken, startRide);

// Protected: update own ride
router.put('/:id', authenticateToken, updateRide);

// Protected: cancel own ride
router.delete('/:id', authenticateToken, deleteRide);

export default router;