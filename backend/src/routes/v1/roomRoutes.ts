import { Router } from 'express';
import { roomController } from '../../controllers/roomController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { requireHostelAccess } from '../../middleware/tenantMiddleware.js';
import { validateBody } from '../../middleware/validateMiddleware.js';
import {
  createRoomSchema,
  updateRoomSchema,
} from '../../validators/roomValidators.js';

const router = Router({ mergeParams: true });

// All room routes require authentication
router.use(requireAuth);

/**
 * GET /api/v1/properties/:propertyId/rooms
 * List all rooms in a property
 */
router.get(
  '/',
  requireHostelAccess,
  roomController.getRoomsByProperty.bind(roomController)
);

/**
 * GET /api/v1/properties/:propertyId/rooms/:roomId
 * Get a single room with its residents
 */
router.get(
  '/:roomId',
  requireHostelAccess,
  roomController.getRoom.bind(roomController)
);

/**
 * POST /api/v1/properties/:propertyId/rooms
 * Create a new room in a property
 */
router.post(
  '/',
  requireHostelAccess,
  validateBody(createRoomSchema),
  roomController.createRoom.bind(roomController)
);

/**
 * PUT /api/v1/properties/:propertyId/rooms/:roomId
 * Update a room
 */
router.put(
  '/:roomId',
  requireHostelAccess,
  validateBody(updateRoomSchema),
  roomController.updateRoom.bind(roomController)
);

/**
 * DELETE /api/v1/properties/:propertyId/rooms/:roomId
 * Soft-delete a room (only if no active residents)
 */
router.delete(
  '/:roomId',
  requireHostelAccess,
  roomController.deleteRoom.bind(roomController)
);

export default router;
