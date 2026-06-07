const jwt = require('jsonwebtoken')
const db = require('../config/database')

const JWT_SECRET = 'cinema-platform-secret-key-2024'

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ error: '未登录' })
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = db.prepare('SELECT id, username, nickname, role, member_level FROM users WHERE id = ?').get(decoded.userId)
    if (!user) {
      return res.status(401).json({ error: '用户不存在' })
    }
    req.user = user
    next()
  } catch (err) {
    res.status(401).json({ error: '登录已过期' })
  }
}

const adminMiddleware = (roles = ['admin', 'operator', 'regional_admin', 'hq_auditor']) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: '无权限访问' })
    }
    next()
  }
}

const logOperation = (action, targetType) => {
  return (req, res, next) => {
    const send = res.send
    res.send = function(body) {
      if (res.statusCode < 400 && req.user) {
        db.prepare(`
          INSERT INTO operation_logs (operator_id, operator_name, action, target_type, target_id, ip, new_value)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          req.user.id,
          req.user.nickname || req.user.username,
          action,
          targetType,
          req.params.id || null,
          req.ip,
          JSON.stringify(req.body)
        )
      }
      send.call(this, body)
    }
    next()
  }
}

module.exports = { authMiddleware, adminMiddleware, logOperation, JWT_SECRET }
