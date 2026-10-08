import { Router } from 'express';

import {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking
} from '../controllers/bookings.controller.js';

import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Passenger: create booking
router.post('/', authenticateToken, createBooking);

// Passenger: own bookings
router.get('/my', authenticateToken, getMyBookings);

// Passenger or driver: booking details
router.get('/:id', authenticateToken, getBookingById);

// Driver: accept/reject booking
router.patch('/:id/status', authenticateToken, updateBookingStatus);

// Passenger: cancel booking
router.delete('/:id', authenticateToken, cancelBooking);

export default router;