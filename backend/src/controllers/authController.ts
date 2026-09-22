import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import { sendSuccess } from '../utils/response.js';
import { auditService } from '../services/auditService.js';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);

      await auditService.log({
        actorId: result.user.id,
        action: 'USER_REGISTER',
        entity: 'User',
        entityId: result.user.id,
        metadata: { email: result.user.email },
        ipAddress: req.ip,
      });

      sendSuccess(res, result, 'Registration successful', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);

      await auditService.log({
        actorId: result.user.id,
        action: 'USER_LOGIN',
        entity: 'User',
        entityId: result.user.id,
        ipAddress: req.ip,
      });

      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      sendSuccess(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.logout(req.user!.id);

      await auditService.log({
        actorId: req.user!.id,
        action: 'USER_LOGOUT',
        entity: 'User',
        entityId: req.user!.id,
        ipAddress: req.ip,
      });

      sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await authService.getProfile(req.user!.id);
      sendSuccess(res, profile, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await authService.updateProfile(req.user!.id, {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
      });
      sendSuccess(res, updated, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
