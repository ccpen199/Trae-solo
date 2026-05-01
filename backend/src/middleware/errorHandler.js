const { logger } = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  if (err.code === '23505') {
    error = new AppError('资源已存在', 409, 'DUPLICATE_RESOURCE');
  }

  if (err.code === '23503') {
    error = new AppError('关联资源不存在', 400, 'REFERENCE_ERROR');
  }

  if (err.name === 'JsonWebTokenError') {
    error = new AppError('无效的令牌', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('令牌已过期', 401, 'TOKEN_EXPIRED');
  }

  if (err.statusCode === 429) {
    error = new AppError('请求过于频繁', 429, 'RATE_LIMIT_EXCEEDED');
  }

  if (!error.isOperational) {
    logger.error('非预期错误:', err);
    error = new AppError('服务器内部错误', 500, 'INTERNAL_ERROR');
  } else {
    logger.warn(`操作错误: ${error.message}`, {
      statusCode: error.statusCode,
      code: error.code,
      path: req.path,
      method: req.method
    });
  }

  res.status(error.statusCode).json({
    success: false,
    error: {
      message: error.message,
      code: error.code,
      timestamp: Date.now()
    }
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler, AppError };
