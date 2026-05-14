function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { errorHandler, asyncHandler };
