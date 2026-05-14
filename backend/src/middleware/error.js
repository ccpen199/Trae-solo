const { error } = require('../utils/response');
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('Request error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json(error(err.message, null, 400));
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json(error('未授权访问', null, 401));
  }

  res.status(500).json(error('服务器内部错误', null, 500));
}

function notFoundHandler(req, res) {
  res.status(404).json(error('接口不存在', null, 404));
}

module.exports = { errorHandler, notFoundHandler };
