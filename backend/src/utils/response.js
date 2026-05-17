const successResponse = (data, message = '操作成功') => ({
  success: true,
  data,
  message
});

const errorResponse = (message = '操作失败', data = null) => ({
  success: false,
  data,
  message
});

const handleError = (res, error, message = '服务器错误') => {
  console.error('Error:', error);
  return res.status(500).json(errorResponse(message, error.message));
};

module.exports = {
  successResponse,
  errorResponse,
  handleError
};
