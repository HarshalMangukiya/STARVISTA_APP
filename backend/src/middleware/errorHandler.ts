import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  // If it's our own AppError
  if (err instanceof AppError) {
    logger.warn(`[${err.code}] ${err.message}`, {
      path: req.path,
      method: req.method,
      statusCode: err.statusCode,
      details: err.details,
    });
    return sendError(res, err.message, err.statusCode, err.code, err.details);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    logger.warn('Validation error', { path: req.path, errors: formattedErrors });
    return sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', formattedErrors);
  }

  // Handle Prisma Known Request Errors
  if (err?.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    logger.error(`Database error [${err.code}]:`, {
      message: err.message,
      meta: err.meta,
      path: req.path,
    });

    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[])?.join(', ') || 'field';
      return sendError(res, `A record with this ${target} already exists.`, 409, 'UNIQUE_CONSTRAINT_VIOLATION');
    }

    if (err.code === 'P2025') {
      return sendError(res, 'Requested record was not found.', 404, 'RECORD_NOT_FOUND');
    }

    return sendError(res, 'Database operation failed.', 400, 'DATABASE_ERROR');
  }

  // Unhandled / Internal Server Error
  logger.error('Unhandled server error:', {
    message: err?.message || 'Unknown error',
    stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
    path: req.path,
    method: req.method,
  });

  return sendError(
    res,
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err?.message || 'Internal server error',
    500,
    'INTERNAL_SERVER_ERROR'
  );
};
