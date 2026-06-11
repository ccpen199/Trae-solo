function success(data = null, message = 'success') {
  return {
    code: 0,
    message,
    data,
    timestamp: Date.now()
  };
}

function error(message = 'error', code = -1, data = null) {
  return {
    code,
    message,
    data,
    timestamp: Date.now()
  };
}

function paginate(list, total, page = 1, pageSize = 20) {
  return success({
    list,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  });
}

module.exports = {
  success,
  error,
  paginate
};
