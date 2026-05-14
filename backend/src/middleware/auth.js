const jwt = require('jsonwebtoken')
const db = require('../database')

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' })
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET)
    const userStmt = db.prepare('SELECT id, phone, nickname, avatar, bio FROM users WHERE id = ?')
    const dbUser = userStmt.get(user.userId)
    
    if (!dbUser) {
      return res.status(401).json({ success: false, message: '用户不存在' })
    }
    
    req.user = dbUser
    next()
  } catch (error) {
    return res.status(403).json({ success: false, message: '登录已过期，请重新登录' })
  }
}

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token) {
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET)
      const userStmt = db.prepare('SELECT id, phone, nickname, avatar, bio FROM users WHERE id = ?')
      const dbUser = userStmt.get(user.userId)
      if (dbUser) {
        req.user = dbUser
      }
    } catch (error) {
    }
  }
  next()
}

module.exports = { authenticateToken, optionalAuth }
