const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err)

  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || '数据'
    return res.status(400).json({
      code: 400,
      message: `${field}已存在`,
    })
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      code: 404,
      message: '记录不存在',
    })
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      code: err.statusCode,
      message: err.message,
    })
  }

  return res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
}

const notFoundHandler = (req, res) => {
  res.status(404).json({
    code: 404,
    message: `接口不存在: ${req.method} ${req.path}`,
  })
}

module.exports = {
  errorHandler,
  notFoundHandler,
}
