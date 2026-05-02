export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: Record<string, unknown>
  ) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class DuplicateSubmissionError extends AppError {
  constructor(requestId: string) {
    super('重复提交请求', 409, 'DUPLICATE_SUBMISSION', { requestId });
  }
}

export class StatusConflictError extends AppError {
  constructor(message: string, resourceType: string, resourceId: string) {
    super(message, 409, 'STATUS_CONFLICT', { resourceType, resourceId });
  }
}

export class PermissionDeniedError extends AppError {
  constructor(message: string = '权限不足，无法执行此操作') {
    super(message, 403, 'PERMISSION_DENIED');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource}不存在`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class ManualReviewRequiredError extends AppError {
  constructor(reviewId: string, reason: string) {
    super('需要人工复核', 422, 'MANUAL_REVIEW_REQUIRED', { reviewId, reason });
  }
}

export class BusinessRuleViolationError extends AppError {
  constructor(message: string, rule: string) {
    super(message, 400, 'BUSINESS_RULE_VIOLATION', { rule });
  }
}

export default AppError;
