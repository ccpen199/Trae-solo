const { error } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json(error('请求参数格式错误'));
  }

  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(400).json(error('数据唯一约束冲突，请勿重复提交'));
  }

  res.status(500).json(error('服务器内部错误', process.env.NODE_ENV === 'development' ? err.message : null));
};

module.exports = errorHandler;
