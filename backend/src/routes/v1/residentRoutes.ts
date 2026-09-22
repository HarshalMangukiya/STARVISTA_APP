import { Router } from 'express';
import { residentController } from '../../controllers/residentController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { requireHostelAccess } from '../../middleware/tenantMiddleware.js';
import { validateBody } from '../../middleware/validateMiddleware.js';
import {
  createResidentSchema,
  updateResidentSchema,
  updatePaymentDatesSchema,
} from '../../validators/residentValidators.js';

const router = Router({ mergeParams: true });

// All resident routes require authentication
router.use(requireAuth);

/**
 * GET /api/v1/properties/:propertyId/rooms/:roomId/residents
 * List all residents in a room
 */
router.get(
  '/',
  requireHostelAccess,
  residentController.getResidents.bind(residentController)
);

/**
 * POST /api/v1/properties/:propertyId/rooms/:roomId/residents
 * Add a new resident to a room (enforces capacity)
 */
router.post(
  '/',
  requireHostelAccess,
  validateBody(createResidentSchema),
  residentController.addResident.bind(residentController)
);

/**
 * PUT /api/v1/properties/:propertyId/rooms/:roomId/residents/:residentId
 * Update resident details
 */
router.put(
  '/:residentId',
  requireHostelAccess,
  validateBody(updateResidentSchema),
  residentController.updateResident.bind(residentController)
);

/**
 * PATCH /api/v1/properties/:propertyId/rooms/:roomId/residents/:residentId/payment
 * Update payment/rent cycle dates for a resident
 */
router.patch(
  '/:residentId/payment',
  requireHostelAccess,
  validateBody(updatePaymentDatesSchema),
  residentController.updatePaymentDates.bind(residentController)
);

/**
 * DELETE /api/v1/properties/:propertyId/rooms/:roomId/residents/:residentId
 * Soft-delete a resident
 */
router.delete(
  '/:residentId',
  requireHostelAccess,
  residentController.deleteResident.bind(residentController)
);

export default router;
