import { Response } from 'express';
import { ApiResponse, ErrorResponse } from '@shared/types';

export function successResponse<T>(res: Response, data: T, message?: string, statusCode = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
}

export function errorResponse(
  res: Response,
  code: string,
  message: string,
  details?: Record<string, string>,
  statusCode = 400
): void {
  const response: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
}

export function notFoundResponse(res: Response, resource: string): void {
  errorResponse(res, 'NOT_FOUND', `${resource} not found`, undefined, 404);
}

export function validationErrorResponse(res: Response, details: Record<string, string>): void {
  errorResponse(res, 'VALIDATION_ERROR', 'Input validation failed', details, 400);
}

export function unauthorizedResponse(res: Response, message = 'Unauthorized'): void {
  errorResponse(res, 'UNAUTHORIZED', message, undefined, 401);
}

export function forbiddenResponse(res: Response, message = 'Forbidden'): void {
  errorResponse(res, 'FORBIDDEN', message, undefined, 403);
}

export function serverErrorResponse(res: Response, error?: Error): void {
  console.error('Server error:', error);
  errorResponse(res, 'INTERNAL_ERROR', 'Internal server error', undefined, 500);
}
