const jwt = require('jsonwebtoken')

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录，请先登录' })
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ code: 401, message: 'Token失效，请重新登录' })
  }
}

const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = decoded
    } catch (err) {
      // 忽略token错误，继续执行
    }
  }
  next()
}

module.exports = {
  authenticate,
  optionalAuth
}