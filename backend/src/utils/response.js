function success(data = null, message = '操作成功') {
  return {
    success: true,
    data,
    message
  };
}

function error(message = '操作失败', data = null, code = 500) {
  return {
    success: false,
    data,
    message,
    code
  };
}

function pagination(list, total, page, pageSize) {
  return {
    list,
    total,
    page: parseInt(page, 10),
    pageSize: parseInt(pageSize, 10),
    totalPages: Math.ceil(total / pageSize)
  };
}

module.exports = { success, error, pagination };
