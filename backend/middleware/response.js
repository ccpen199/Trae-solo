export const successResponse = (res, data, message = 'success') => {
  res.json({
    success: true,
    data,
    message
  });
};

export const errorResponse = (res, message = 'error', status = 500) => {
  res.status(status).json({
    success: false,
    data: null,
    message
  });
};

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error('API Error:', error);
      errorResponse(res, error.message || 'Internal Server Error', 500);
    });
  };
};
