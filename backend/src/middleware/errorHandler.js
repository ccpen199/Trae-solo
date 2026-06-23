const errorHandler = (err, req, res, next) => {
  console.error('❌ 错误:', err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors
    });
  }

  if (err.code === 11000) {
    const key = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${key} 已存在`,
      error: err.keyValue
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '认证令牌无效'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '认证令牌已过期'
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: '无效的ID格式'
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `未找到 ${req.method} ${req.originalUrl}`
  });
};

module.exports = { errorHandler, notFound };
