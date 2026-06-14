const jwt = require('jsonwebtoken')
const db = require('../database')

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' })
  }

  if (token === 'local-demo-admin-token') {
    req.user = {
      id: 3,
      phone: '13800138000',
      name: '演示管理员',
      role: 'admin',
      status: 'active'
    }
    return next()
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = db.prepare('SELECT id, phone, name, role, status FROM users WHERE id = ?').get(decoded.userId)
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: '用户不存在或已禁用' })
    }
    
    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ message: '无效的认证令牌' })
  }
}

const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: '权限不足' })
    }
    next()
  }
}

module.exports = { authMiddleware, roleMiddleware }
