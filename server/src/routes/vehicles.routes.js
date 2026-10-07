import { Router } from 'express';
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle
} from '../controllers/vehicles.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createVehicleSchema,
  updateVehicleSchema
} from '../validators/vehicle.validator.js';

const router = Router();

// All vehicle endpoints require authentication
router.use(authenticateToken);

// POST /api/vehicles - Add new vehicle
router.post('/', validate(createVehicleSchema), createVehicle);

// GET /api/vehicles - List authenticated user's vehicles
router.get('/', getVehicles);

// GET /api/vehicles/:id - Get specific vehicle
router.get('/:id', getVehicleById);

// PUT /api/vehicles/:id - Update specific vehicle
router.put('/:id', validate(updateVehicleSchema), updateVehicle);

// DELETE /api/vehicles/:id - Delete specific vehicle
router.delete('/:id', deleteVehicle);

export default router;
