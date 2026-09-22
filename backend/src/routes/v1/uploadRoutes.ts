import { Router } from 'express';
import { uploadController } from '../../controllers/uploadController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';

const router = Router();

// All upload routes require authentication
router.use(requireAuth);

/**
 * POST /api/v1/upload/image
 * Upload an image (base64 or URL). Returns Cloudinary secure URL and public ID.
 * Body: { image: "data:image/png;base64,..." or "https://...", folder?: "starvista" }
 */
router.post(
  '/image',
  uploadController.uploadImage.bind(uploadController)
);

export default router;
