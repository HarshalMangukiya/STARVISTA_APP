import { Router } from 'express';
import { authController } from '../../controllers/authController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { validateBody } from '../../middleware/validateMiddleware.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '../../validators/authValidators.js';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user account
 */
router.post(
  '/register',
  authRateLimiter,
  validateBody(registerSchema),
  authController.register.bind(authController)
);

/**
 * POST /api/v1/auth/login
 * Login with email and password
 */
router.post(
  '/login',
  authRateLimiter,
  validateBody(loginSchema),
  authController.login.bind(authController)
);

/**
 * POST /api/v1/auth/refresh-token
 * Refresh access token using refresh token
 */
router.post(
  '/refresh-token',
  validateBody(refreshTokenSchema),
  authController.refreshToken.bind(authController)
);

/**
 * POST /api/v1/auth/logout
 * Logout and revoke all tokens (requires authentication)
 */
router.post(
  '/logout',
  requireAuth,
  authController.logout.bind(authController)
);

/**
 * GET /api/v1/auth/me
 * Get the current authenticated user's profile
 */
router.get(
  '/me',
  requireAuth,
  authController.getProfile.bind(authController)
);

/**
 * PATCH /api/v1/auth/me
 * Update the current authenticated user's profile
 */
router.patch(
  '/me',
  requireAuth,
  authController.updateProfile.bind(authController)
);

export default router;
