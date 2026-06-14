function successResponse(res, data = null, message = 'success', code = 200) {
  return res.status(code).json({
    code,
    message,
    data,
    timestamp: Date.now()
  });
}

function errorResponse(res, message = 'error', code = 500, errors = null) {
  return res.status(code).json({
    code,
    message,
    errors,
    timestamp: Date.now()
  });
}

function responseMiddleware(req, res, next) {
  res.success = (data, message, code) => successResponse(res, data, message, code);
  res.error = (message, code, errors) => errorResponse(res, message, code, errors);
  next();
}

module.exports = { responseMiddleware, successResponse, errorResponse };
