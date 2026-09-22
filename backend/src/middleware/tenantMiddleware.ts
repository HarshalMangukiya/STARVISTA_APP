import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/errors.js';
import { prisma } from '../config/database.js';

/**
 * Validates that the authenticated user owns or is authorized staff for the hostel
 * Extracts propertyId from req.params.propertyId, req.params.id, or req.body.property_id
 */
export const requireHostelAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    // Platform Super Admin bypasses tenant checks
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    const propertyId =
      req.params.propertyId ||
      req.params.id ||
      req.body.property_id ||
      (req.query.propertyId as string);

    if (!propertyId) {
      return next(); // If no property context in route, continue
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        staff_members: {
          where: { user_id: req.user.id },
        },
      },
    });

    if (!property || !property.is_active) {
      return next(new NotFoundError('Property not found'));
    }

    const isOwner = property.owner_id === req.user.id;
    const isStaff = property.staff_members.length > 0;

    if (!isOwner && !isStaff) {
      return next(
        new ForbiddenError('You do not have permission to access or modify this property')
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
