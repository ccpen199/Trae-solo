function success(res, data = null, message = '操作成功') {
  return res.json({
    success: true,
    data,
    message
  });
}

function error(res, message = '操作失败', statusCode = 400, data = null) {
  return res.status(statusCode).json({
    success: false,
    data,
    message
  });
}

function notFound(res, message = '资源不存在') {
  return error(res, message, 404);
}

function unauthorized(res, message = '未授权访问') {
  return error(res, message, 401);
}

function forbidden(res, message = '无权限访问') {
  return error(res, message, 403);
}

function serverError(res, message = '服务器内部错误') {
  return error(res, message, 500);
}

module.exports = {
  success,
  error,
  notFound,
  unauthorized,
  forbidden,
  serverError
};
