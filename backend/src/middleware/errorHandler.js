const errorHandler = (err, req, res, next) => {
  console.error('错误:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  
  const errorResponse = {
    success: false,
    message: message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  };
  
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: '数据重复',
      errors: err.errors.map(e => ({
        field: e.path,
        message: '该值已存在'
      }))
    });
  }
  
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: '关联数据不存在'
    });
  }
  
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      success: false,
      message: '数据已存在'
    });
  }
  
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      message: '服务暂时不可用，请稍后重试'
    });
  }
  
  res.status(statusCode).json(errorResponse);
};

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
};

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  notFound,
  AppError
};
