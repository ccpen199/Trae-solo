const success = (data = null, message = 'success') => {
  return {
    success: true,
    data,
    message
  };
};

const error = (message = 'error', data = null) => {
  return {
    success: false,
    data,
    message
  };
};

const pagination = (list, total, page, pageSize) => {
  return {
    list,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    totalPages: Math.ceil(total / pageSize)
  };
};

module.exports = { success, error, pagination };