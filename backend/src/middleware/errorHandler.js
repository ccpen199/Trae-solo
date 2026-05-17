const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '参数验证失败',
      errors: err.errors
    });
  }
  
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(400).json({
      success: false,
      message: '数据已存在'
    });
  }
  
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
};

module.exports = errorHandler;
