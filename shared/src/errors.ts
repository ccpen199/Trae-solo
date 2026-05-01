export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, code: string = 'BAD_REQUEST') {
    super(message, 400, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '未授权访问', code: string = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '无权限访问', code: string = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '资源不存在', code: string = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: string = 'CONFLICT') {
    super(message, 409, code);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = '请求过于频繁', code: string = 'TOO_MANY_REQUESTS') {
    super(message, 429, code);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = '服务器内部错误', code: string = 'INTERNAL_ERROR') {
    super(message, 500, code, false);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = '服务暂时不可用', code: string = 'SERVICE_UNAVAILABLE') {
    super(message, 503, code);
  }
}

export class ValidationError extends BadRequestError {
  public readonly errors: any[];

  constructor(message: string = '参数验证失败', errors: any[] = []) {
    super(message, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class FrequencyLimitExceededError extends TooManyRequestsError {
  public readonly limit: number;
  public readonly current: number;
  public readonly windowEnd: Date;

  constructor(message: string, limit: number, current: number, windowEnd: Date) {
    super(message, 'FREQUENCY_LIMIT_EXCEEDED');
    this.limit = limit;
    this.current = current;
    this.windowEnd = windowEnd;
  }
}

export class ComplianceViolationError extends BadRequestError {
  public readonly violations: any[];

  constructor(message: string, violations: any[] = []) {
    super(message, 'COMPLIANCE_VIOLATION');
    this.violations = violations;
  }
}

export class InsufficientBalanceError extends BadRequestError {
  public readonly currentBalance: number;
  public readonly requiredAmount: number;

  constructor(currentBalance: number, requiredAmount: number) {
    super(`余额不足，当前余额: ${currentBalance}, 需要: ${requiredAmount}`, 'INSUFFICIENT_BALANCE');
    this.currentBalance = currentBalance;
    this.requiredAmount = requiredAmount;
  }
}
