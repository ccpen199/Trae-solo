const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const JWT_SECRET = 'ent-portal-dev-secret-change-me'
const JWT_EXPIRE = '12h'

function sign(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, display_name: user.display_name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  )
}

function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ code: 401, message: '未登录' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    req.db.prepare('INSERT INTO audit_logs (user_id, username, action, target_type, detail, ip) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, req.user.username, 'api_call', 'http', `${req.method} ${req.path}`, req.ip)
    next()
  } catch (e) {
    return res.status(401).json({ code: 401, message: '会话已过期' })
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ code: 401, message: '未登录' })
    if (roles.length && !roles.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '权限不足' })
    }
    next()
  }
}

module.exports = { sign, auth, requireRole, JWT_SECRET, JWT_EXPIRE }
