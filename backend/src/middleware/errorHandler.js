function errorHandler(err, req, res, next) {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }
  
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(400).json({ success: false, message: '数据已存在' });
  }

  res.status(500).json({ success: false, message: '服务器内部错误' });
}

module.exports = { errorHandler };
