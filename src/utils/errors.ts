export enum ErrorCode {
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  BAD_REQUEST = 'BAD_REQUEST',
  
  TEACHER_CONFLICT = 'TEACHER_CONFLICT',
  CLASSROOM_CONFLICT = 'CLASSROOM_CONFLICT',
  STUDENT_CONFLICT = 'STUDENT_CONFLICT',
  TIME_OVERLAP = 'TIME_OVERLAP',
  
  INSUFFICIENT_HOURS = 'INSUFFICIENT_HOURS',
  ENROLLMENT_EXPIRED = 'ENROLLMENT_EXPIRED',
  ENROLLMENT_INACTIVE = 'ENROLLMENT_INACTIVE',
  
  DUPLICATE_ATTENDANCE = 'DUPLICATE_ATTENDANCE',
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  
  PORT_OCCUPIED = 'PORT_OCCUPIED',
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ConflictError extends AppError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.CONFLICT,
    details?: Record<string, unknown>
  ) {
    super(message, code, 409, details);
    this.name = 'ConflictError';
  }
}

export class TimetableConflictError extends ConflictError {
  public readonly conflictType: string;
  public readonly conflicts: Array<{
    type: string;
    entityId: string;
    entityName: string;
    timeRange: { start: string; end: string };
  }>;

  constructor(
    message: string,
    conflictType: string,
    conflicts: Array<{
      type: string;
      entityId: string;
      entityName: string;
      timeRange: { start: string; end: string };
    }>
  ) {
    super(message, ErrorCode.CONFLICT, { conflictType, conflicts });
    this.name = 'TimetableConflictError';
    this.conflictType = conflictType;
    this.conflicts = conflicts;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, ErrorCode.NOT_FOUND, 404, details);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '未授权访问', details?: Record<string, unknown>) {
    super(message, ErrorCode.UNAUTHORIZED, 401, details);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '权限不足', details?: Record<string, unknown>) {
    super(message, ErrorCode.FORBIDDEN, 403, details);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, details);
    this.name = 'ValidationError';
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.BAD_REQUEST, details?: Record<string, unknown>) {
    super(message, code, 400, details);
    this.name = 'BadRequestError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorResponse(error: unknown) {
  if (isAppError(error)) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
  }

  return {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: (error as Error).message || '服务器内部错误',
    },
  };
}

export default {
  AppError,
  ConflictError,
  TimetableConflictError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  BadRequestError,
  ErrorCode,
  isAppError,
  getErrorResponse,
};
