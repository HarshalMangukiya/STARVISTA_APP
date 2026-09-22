import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/errors.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { prisma } from '../config/database.js';
import { Role } from '@prisma/client';

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Access token has expired');
      }
      throw new UnauthorizedError('Invalid access token');
    }

    // Verify user is still active in database
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, is_active: true },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedError('User account not found or deactivated');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};
