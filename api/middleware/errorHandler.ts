import { type Request, type Response, type NextFunction } from 'express'

class HttpError extends Error {
  statusCode: number
  message: string

  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
    this.message = message
    this.name = 'HttpError'
  }
}

export const errorHandler = (
  error: Error | HttpError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const isProduction = process.env.NODE_ENV === 'production'

  let statusCode = 500
  let errorMessage = 'Server internal error'
  let message: string | undefined

  if (error instanceof HttpError) {
    statusCode = error.statusCode
    errorMessage = getErrorMessage(statusCode)
    message = error.message
  } else if (error.name === 'SyntaxError' && 'body' in error) {
    statusCode = 400
    errorMessage = 'Bad Request'
    message = 'Invalid JSON format'
  } else if (error.name === 'ValidationError') {
    statusCode = 400
    errorMessage = 'Bad Request'
    message = error.message
  } else if (error.message.includes('not found') || error.message.includes('does not exist')) {
    statusCode = 404
    errorMessage = 'Not Found'
    message = isProduction ? undefined : error.message
  } else if (error.message.includes('unauthorized') || error.message.includes('Unauthorized')) {
    statusCode = 401
    errorMessage = 'Unauthorized'
    message = isProduction ? undefined : error.message
  } else if (error.message.includes('forbidden') || error.message.includes('Forbidden')) {
    statusCode = 403
    errorMessage = 'Forbidden'
    message = isProduction ? undefined : error.message
  }

  const response: { success: boolean; error: string; message?: string; stack?: string } = {
    success: false,
    error: errorMessage,
  }

  if (message) {
    response.message = message
  }

  if (!isProduction && error.stack) {
    response.stack = error.stack
  }

  res.status(statusCode).json(response)
}

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  })
}

const getErrorMessage = (statusCode: number): string => {
  const errorMessages: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Server internal error',
  }
  return errorMessages[statusCode] || 'Server internal error'
}

export { HttpError }
export default errorHandler
