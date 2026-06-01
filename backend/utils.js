const db = require('./db')

function generateNo(prefix) {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `${prefix}${year}${month}${day}${random}`
}

function logOperation(module, action, recordId, operator, ipAddress, details) {
  try {
    const stmt = db.prepare(`
      INSERT INTO operation_logs (module, action, record_id, operator, ip_address, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    stmt.run(module, action, recordId, operator, ipAddress, JSON.stringify(details))
  } catch (err) {
    console.error('记录操作日志失败:', err)
  }
}

function handleAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

function successResponse(res, data = null, message = 'success') {
  res.json({
    code: 0,
    message,
    data
  })
}

function errorResponse(res, message = 'error', code = 1, status = 400) {
  res.status(status).json({
    code,
    message,
    data: null
  })
}

module.exports = {
  generateNo,
  logOperation,
  handleAsync,
  successResponse,
  errorResponse
}
