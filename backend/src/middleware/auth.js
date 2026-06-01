const jwt = require('jsonwebtoken')
const db = require('../database/init')

const JWT_SECRET = 'life-platform-secret-key-2024'

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ error: '未登录' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = db.prepare('SELECT id, phone, nickname, role FROM users WHERE id = ?').get(decoded.userId)
    
    if (!user) {
      return res.status(401).json({ error: '用户不存在' })
    }
    
    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Token 无效' })
  }
}

const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: '无权限访问' })
  }
  next()
}

module.exports = { authMiddleware, adminMiddleware, JWT_SECRET }
