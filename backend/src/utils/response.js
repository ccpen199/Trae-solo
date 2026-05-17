const success = (data = null, message = 'success') => {
  return {
    success: true,
    data,
    message
  };
};

const error = (message = 'error', data = null, code = 500) => {
  return {
    success: false,
    data,
    message,
    code
  };
};

module.exports = {
  success,
  error
};
