import { type Request, type Response, type NextFunction } from 'express'
import type { ApiResponse } from '../../shared/types/index.js'

export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404)
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403)
  }
}

const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (error instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: error.message,
    }
    res.status(error.statusCode).json(response)
    return
  }

  if (error.name === 'SyntaxError' && 'body' in error) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid JSON payload',
    }
    res.status(400).json(response)
    return
  }

  console.error('[Unhandled Error]', error)

  const response: ApiResponse = {
    success: false,
    error: 'Server internal error',
  }
  res.status(500).json(response)
}

export default errorHandler
