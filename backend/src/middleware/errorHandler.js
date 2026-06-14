const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  let statusCode = err.statusCode || 500;
  let message = err.message || '服务器内部错误';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map(e => e.message);
    message = errors.join(', ');
  }

  if (err.code === 11000) {
    statusCode = 400;
    const key = Object.keys(err.keyPattern)[0];
    message = `${key} 已存在，请使用其他值`;
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = '无效的ID格式';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = '无效的令牌，请重新登录';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = '令牌已过期，请重新登录';
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    message: message
  });
};

module.exports = errorHandler;
