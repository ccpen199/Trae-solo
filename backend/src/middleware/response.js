function responseMiddleware(req, res, next) {
  res.success = function(data = null, message = '操作成功') {
    return res.json({ success: true, data, message })
  }
  
  res.error = function(message = '操作失败', code = 400, data = null) {
    return res.status(code).json({ success: false, message, data, code })
  }
  
  next()
}

function errorHandler(err, req, res, next) {
  console.error('服务器错误:', err)
  res.error('服务器内部错误', 500, { error: err.message })
}

module.exports = { responseMiddleware, errorHandler }
