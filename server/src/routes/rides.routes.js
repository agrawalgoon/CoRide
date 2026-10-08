import { Router } from 'express';

import {
  createRide,
  getRides,
  getMyRides,
  getRideById,
  updateRide,
  deleteRide,
  getMatches
} from '../controllers/rides.controller.js';

import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Protected: AI matching for passenger
router.get('/matches', authenticateToken, getMatches);

// Public: search/list scheduled rides
router.get('/', getRides);

// Protected: driver's own rides
router.get('/my', authenticateToken, getMyRides);

// Protected: offer a new ride
router.post('/', authenticateToken, createRide);

// Public: get ride details
router.get('/:id', getRideById);

// Protected: update own ride
router.put('/:id', authenticateToken, updateRide);

// Protected: cancel own ride
router.delete('/:id', authenticateToken, deleteRide);

export default router;