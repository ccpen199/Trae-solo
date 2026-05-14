function success(data = null, message = '操作成功') {
  return {
    success: true,
    data,
    message
  };
}

function error(message = '操作失败', data = null) {
  return {
    success: false,
    data,
    message
  };
}

function errorWithCode(code, message = '操作失败', data = null) {
  return {
    success: false,
    code,
    data,
    message
  };
}

function notFound(message = '资源不存在') {
  return {
    success: false,
    code: 404,
    message
  };
}

function unauthorized(message = '未授权访问') {
  return {
    success: false,
    code: 401,
    message
  };
}

module.exports = {
  success,
  error,
  errorWithCode,
  notFound,
  unauthorized
};
