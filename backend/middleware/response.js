const responseHandler = (req, res, next) => {
  res.success = (data = null, message = 'success') => {
    res.json({
      success: true,
      data,
      message
    });
  };

  res.error = (message = 'error', data = null, code = 400) => {
    res.status(code).json({
      success: false,
      data,
      message
    });
  };

  next();
};

module.exports = responseHandler;
