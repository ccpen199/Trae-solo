const jwt = require('jsonwebtoken')
const db = require('../database')

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ success: false, message: '未登录或令牌已过期' })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: '令牌无效' })
    }

    const admin = db.prepare('SELECT a.*, r.name as role_name, r.permissions FROM admins a JOIN roles r ON a.role_id = r.id WHERE a.id = ?').get(decoded.userId)
    
    if (!admin || admin.status !== 1) {
      return res.status(401).json({ success: false, message: '用户不存在或已被禁用' })
    }

    req.user = {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      role: admin.role_name,
      permissions: JSON.parse(admin.permissions)
    }
    next()
  })
}

function checkPermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '未登录' })
    }

    const { permissions } = req.user
    if (permissions.includes('all') || permissions.includes(permission)) {
      next()
    } else {
      return res.status(403).json({ success: false, message: '没有权限执行此操作' })
    }
  }
}

module.exports = {
  authenticateToken,
  checkPermission
}
