const success = (data, message = '操作成功') => {
  return {
    code: 0,
    message,
    data,
  };
};

const error = (message, code = -1, data = null) => {
  return {
    code,
    message,
    data,
  };
};

const pagination = (list, total, page, pageSize) => {
  return {
    list,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

module.exports = {
  success,
  error,
  pagination,
};
