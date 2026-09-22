import { Router } from 'express';
import { propertyController } from '../../controllers/propertyController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { requireHostelAccess } from '../../middleware/tenantMiddleware.js';
import { validateBody, validateQuery } from '../../middleware/validateMiddleware.js';
import {
  createPropertySchema,
  updatePropertySchema,
  propertyQuerySchema,
} from '../../validators/propertyValidators.js';

const router = Router();

// All property routes require authentication
router.use(requireAuth);

/**
 * GET /api/v1/properties
 * List all properties owned by the authenticated user
 */
router.get(
  '/',
  validateQuery(propertyQuerySchema),
  propertyController.getProperties.bind(propertyController)
);

/**
 * GET /api/v1/properties/:id
 * Get a single property by ID
 */
router.get(
  '/:id',
  requireHostelAccess,
  propertyController.getProperty.bind(propertyController)
);

/**
 * POST /api/v1/properties
 * Create a new property
 */
router.post(
  '/',
  validateBody(createPropertySchema),
  propertyController.createProperty.bind(propertyController)
);

/**
 * PUT /api/v1/properties/:id
 * Update an existing property
 */
router.put(
  '/:id',
  requireHostelAccess,
  validateBody(updatePropertySchema),
  propertyController.updateProperty.bind(propertyController)
);

/**
 * DELETE /api/v1/properties/:id
 * Soft-delete a property
 */
router.delete(
  '/:id',
  requireHostelAccess,
  propertyController.deleteProperty.bind(propertyController)
);

export default router;
