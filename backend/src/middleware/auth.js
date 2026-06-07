const jwt = require('jsonwebtoken')

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'wedding-saas-secret-key-2024')
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ message: '认证令牌无效或已过期' })
  }
}

function roleMiddleware(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: '请先登录' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: '权限不足' })
    }
    next()
  }
}

module.exports = { authMiddleware, roleMiddleware }
