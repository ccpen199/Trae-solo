function success(data, message = '操作成功') {
  return {
    success: true,
    message,
    data
  };
}

function error(message = '操作失败', data = null) {
  return {
    success: false,
    message,
    data
  };
}

module.exports = { success, error };
