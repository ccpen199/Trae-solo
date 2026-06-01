const success = (data = null, message = '操作成功') => {
  return {
    success: true,
    message,
    data
  };
};

const error = (message = '操作失败', data = null) => {
  return {
    success: false,
    message,
    data
  };
};

const generateTransactionNo = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `WD${timestamp}${random}`;
};

module.exports = { success, error, generateTransactionNo };