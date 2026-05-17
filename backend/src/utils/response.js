function success(data, message = '操作成功') {
  return {
    success: true,
    data,
    message
  };
}

function error(message = '操作失败') {
  return {
    success: false,
    message
  };
}

module.exports = { success, error };
