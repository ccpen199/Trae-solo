const success = (res, data, message = '操作成功') => {
  res.json({
    success: true,
    data,
    message
  });
};

const error = (res, message = '操作失败', code = 400) => {
  res.status(code).json({
    success: false,
    message
  });
};

const paginate = (res, list, total, page, pageSize, message = '获取成功') => {
  res.json({
    success: true,
    data: {
      list,
      pagination: {
        total: parseInt(total),
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(parseInt(total) / parseInt(pageSize))
      }
    },
    message
  });
};

module.exports = { success, error, paginate };
