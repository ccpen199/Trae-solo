export class BusinessException extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly errors?: any;

  constructor(
    message: string,
    code: string = 'BUSINESS_ERROR',
    statusCode: number = 400,
    errors?: any,
  ) {
    super(message);
    this.name = 'BusinessException';
    this.code = code;
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
