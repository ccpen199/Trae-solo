import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function successResponse<T>(data: T, statusCode: number = 200): { statusCode: number; body: ApiResponse<T> } {
  return {
    statusCode,
    body: {
      success: true,
      data,
    },
  };
}

export function paginatedResponse<T>(
  data: T[],
  pagination: { page: number; pageSize: number; total: number },
  statusCode: number = 200
): { statusCode: number; body: ApiResponse<T[]> } {
  const { page, pageSize, total } = pagination;
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    statusCode,
    body: {
      success: true,
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    },
  };
}

export function createdResponse<T>(data: T): { statusCode: number; body: ApiResponse<T> } {
  return successResponse(data, 201);
}

export function noContentResponse(): { statusCode: number; body: null } {
  return {
    statusCode: 204,
    body: null,
  };
}

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200): Response {
  const response = successResponse(data, statusCode);
  return res.status(response.statusCode).json(response.body);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: { page: number; pageSize: number; total: number },
  statusCode: number = 200
): Response {
  const response = paginatedResponse(data, pagination, statusCode);
  return res.status(response.statusCode).json(response.body);
}

export function sendCreated<T>(res: Response, data: T): Response {
  const response = createdResponse(data);
  return res.status(response.statusCode).json(response.body);
}

export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}

export default {
  successResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
  sendSuccess,
  sendPaginated,
  sendCreated,
  sendNoContent,
};
