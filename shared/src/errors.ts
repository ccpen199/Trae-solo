import { ERROR_CODES, HTTP_STATUS_CODES } from './constants';

export class BaseError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = ERROR_CODES.INTERNAL_SERVER_ERROR,
    statusCode: number = HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    details?: Record<string, unknown>,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

export class ValidationError extends BaseError {
  constructor(
    message: string = 'Validation failed',
    details?: Record<string, unknown>
  ) {
    super(
      message,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS_CODES.BAD_REQUEST,
      details
    );
  }
}

export class AuthenticationError extends BaseError {
  constructor(
    message: string = 'Authentication failed',
    details?: Record<string, unknown>
  ) {
    super(
      message,
      ERROR_CODES.AUTHENTICATION_ERROR,
      HTTP_STATUS_CODES.UNAUTHORIZED,
      details
    );
  }
}

export class AuthorizationError extends BaseError {
  constructor(
    message: string = 'Access denied',
    details?: Record<string, unknown>
  ) {
    super(
      message,
      ERROR_CODES.AUTHORIZATION_ERROR,
      HTTP_STATUS_CODES.FORBIDDEN,
      details
    );
  }
}

export class ResourceNotFoundError extends BaseError {
  constructor(
    resourceType: string,
    resourceId: string
  ) {
    super(
      `${resourceType} with id ${resourceId} not found`,
      ERROR_CODES.RESOURCE_NOT_FOUND,
      HTTP_STATUS_CODES.NOT_FOUND,
      { resourceType, resourceId }
    );
  }
}

export class ResourceAlreadyExistsError extends BaseError {
  constructor(
    resourceType: string,
    identifier: string
  ) {
    super(
      `${resourceType} with identifier ${identifier} already exists`,
      ERROR_CODES.RESOURCE_ALREADY_EXISTS,
      HTTP_STATUS_CODES.CONFLICT,
      { resourceType, identifier }
    );
  }
}

export class InvalidStateTransitionError extends BaseError {
  constructor(
    currentState: string,
    targetState: string,
    resourceType: string
  ) {
    super(
      `Invalid state transition from ${currentState} to ${targetState} for ${resourceType}`,
      ERROR_CODES.INVALID_STATE_TRANSITION,
      HTTP_STATUS_CODES.CONFLICT,
      { currentState, targetState, resourceType }
    );
  }
}

export class BusinessRuleViolationError extends BaseError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(
      message,
      ERROR_CODES.BUSINESS_RULE_VIOLATION,
      HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY,
      details
    );
  }
}

export class PaymentError extends BaseError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(
      message,
      ERROR_CODES.PAYMENT_ERROR,
      HTTP_STATUS_CODES.PAYMENT_REQUIRED,
      details
    );
  }
}

export class ExternalServiceError extends BaseError {
  constructor(
    serviceName: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(
      `External service ${serviceName} error: ${message}`,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      HTTP_STATUS_CODES.BAD_GATEWAY,
      { serviceName, ...details }
    );
  }
}

export class ConcurrencyError extends BaseError {
  constructor(
    message: string = 'Concurrency conflict detected',
    details?: Record<string, unknown>
  ) {
    super(
      message,
      ERROR_CODES.CONCURRENCY_ERROR,
      HTTP_STATUS_CODES.CONFLICT,
      details
    );
  }
}

export class TimeoutError extends BaseError {
  constructor(
    operation: string,
    timeout: number
  ) {
    super(
      `Operation ${operation} timed out after ${timeout}ms`,
      ERROR_CODES.TIMEOUT_ERROR,
      HTTP_STATUS_CODES.GATEWAY_TIMEOUT,
      { operation, timeout }
    );
  }
}

export class RateLimitExceededError extends BaseError {
  constructor(
    message: string = 'Rate limit exceeded',
    details?: Record<string, unknown>
  ) {
    super(
      message,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      HTTP_STATUS_CODES.TOO_MANY_REQUESTS,
      details
    );
  }
}

export class InternalServerError extends BaseError {
  constructor(
    message: string = 'Internal server error',
    details?: Record<string, unknown>
  ) {
    super(
      message,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
      details,
      false
    );
  }
}

export class ServiceUnavailableError extends BaseError {
  constructor(
    serviceName: string,
    retryAfter?: number
  ) {
    super(
      `Service ${serviceName} is currently unavailable`,
      ERROR_CODES.SERVICE_UNAVAILABLE,
      HTTP_STATUS_CODES.SERVICE_UNAVAILABLE,
      { serviceName, retryAfter }
    );
  }
}

export function isOperationalError(error: Error): boolean {
  if (error instanceof BaseError) {
    return error.isOperational;
  }
  return false;
}

export function normalizeError(error: unknown): BaseError {
  if (error instanceof BaseError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new InternalServerError(error.message, { originalError: error.stack });
  }
  
  return new InternalServerError('Unknown error', { originalError: error });
}
