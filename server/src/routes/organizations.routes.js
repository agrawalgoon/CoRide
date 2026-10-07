import { Router } from 'express';
import {
  createOrganization,
  getOrganizations,
  getOrganizationById
} from '../controllers/organizations.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Public: list active organizations
router.get('/', getOrganizations);

// Public: get one organization
router.get('/:id', getOrganizationById);

// Protected: create organization
router.post('/', authenticateToken, createOrganization);

export default router;