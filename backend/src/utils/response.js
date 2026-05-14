function success(data = null, message = '操作成功') {
  return { success: true, data, message };
}

function fail(message = '操作失败', data = null) {
  return { success: false, data, message };
}

module.exports = { success, fail };
