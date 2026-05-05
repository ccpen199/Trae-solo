const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  let statusCode = err.statusCode || 500;
  let message = err.message || '服务器内部错误';
  let errors = err.errors || null;
  
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = '数据验证失败';
    errors = err.errors.map(e => ({ field: e.path, message: e.message }));
  }
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = '数据已存在';
    errors = err.errors.map(e => ({ field: e.path, message: `${e.path} 已存在` }));
  }
  
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = '关联数据不存在';
  }
  
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 400;
    message = '数据重复';
  }
  
  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  AppError
};
