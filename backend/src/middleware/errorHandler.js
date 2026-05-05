const { error } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Prisma 错误处理
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        return res.status(400).json(error('数据已存在', 400));
      case 'P2025':
        return res.status(404).json(error('记录不存在', 404));
      default:
        return res.status(500).json(error('数据库操作失败', 500));
    }
  }
  
  // 自定义错误
  if (err.message) {
    return res.status(400).json(error(err.message, 400));
  }
  
  // 默认错误
  res.status(500).json(error('服务器内部错误', 500));
};

const notFoundHandler = (req, res) => {
  res.status(404).json(error('接口不存在', 404));
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
