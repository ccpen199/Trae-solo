const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.error(err.message, null, 400);
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.error('未授权访问', null, 401);
  }
  
  if (err.name === 'NotFoundError') {
    return res.error(err.message || '资源不存在', null, 404);
  }
  
  res.error('服务器内部错误', process.env.NODE_ENV === 'development' ? err.stack : null, 500);
};

module.exports = errorHandler;
