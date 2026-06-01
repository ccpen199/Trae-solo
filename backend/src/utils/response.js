const success = (data = null, message = "操作成功") => {
  return {
    code: 200,
    message,
    data
  };
};

const error = (message = "操作失败", code = 400) => {
  return {
    code,
    message,
    data: null
  };
};

const pagination = (data = [], total = 0, page = 1, pageSize = 10) => {
  return {
    code: 200,
    message: "查询成功",
    data: {
      list: data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  };
};

module.exports = {
  success,
  error,
  pagination
};
