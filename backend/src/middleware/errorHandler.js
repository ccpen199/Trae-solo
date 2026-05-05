const errorHandler = (err, req, res, next) => {
  console.error('错误:', err.message);
  console.error(err.stack);

  let statusCode = 500;
  let message = '服务器内部错误';
  let details = null;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = '数据验证失败';
    details = err.details;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = '未授权访问';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = '权限不足';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = err.message || '资源不存在';
  } else if (err.code === '23505') {
    statusCode = 400;
    message = '数据已存在';
  } else if (err.code === '23503') {
    statusCode = 400;
    message = '关联数据不存在';
  } else if (err.message) {
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    details,
    timestamp: new Date().toISOString(),
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
    path: req.path,
    method: req.method,
  });
};

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400);
    this.name = 'ValidationError';
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ForbiddenError extends AppError {
  constructor(message = '权限不足') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

class UnauthorizedError extends AppError {
  constructor(message = '未授权访问') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  AppError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
};