function success(data, message = '操作成功') {
  return {
    success: true,
    data,
    message,
  };
}

function error(message = '操作失败', data = null) {
  return {
    success: false,
    data,
    message,
  };
}

function wrapAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { success, error, wrapAsync };
