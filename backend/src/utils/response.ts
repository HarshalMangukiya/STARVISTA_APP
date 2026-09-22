import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response => {
  const body: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(body);
};

export const sendPaginatedSuccess = <T>(
  res: Response,
  data: T[],
  pagination: { page: number; limit: number; total: number },
  message?: string,
  statusCode = 200
): Response => {
  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;
  const body: ApiResponse<T[]> = {
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPrevPage: pagination.page > 1,
    },
  };
  return res.status(statusCode).json(body);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  code = 'INTERNAL_SERVER_ERROR',
  details?: any
): Response => {
  const body: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
  return res.status(statusCode).json(body);
};
