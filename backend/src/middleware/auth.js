import jwt from 'jsonwebtoken'
import db from '../utils/db.js'

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未提供认证令牌' })
  }
  
  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = db.prepare('SELECT id, username, role, phone, real_name, status FROM users WHERE id = ?').get(decoded.userId)
    
    if (!user) {
      return res.status(401).json({ code: 401, message: '用户不存在' })
    }
    
    if (user.status === 'banned') {
      return res.status(403).json({ code: 403, message: '账号已被封禁' })
    }
    
    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ code: 401, message: '认证令牌无效或已过期' })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ code: 403, message: '权限不足' })
    }
    next()
  }
}

export function requireVerified(req, res, next) {
  if (req.user.role === 'shipper') {
    const enterprise = db.prepare('SELECT status FROM enterprise_info WHERE shipper_id = ?').get(req.user.id)
    if (!enterprise || enterprise.status !== 'verified') {
      return res.status(403).json({ code: 403, message: '企业资质未通过认证，无法进行此操作' })
    }
  } else if (req.user.role === 'driver') {
    const driverInfo = db.prepare('SELECT * FROM driver_info WHERE driver_id = ?').get(req.user.id)
    if (!driverInfo) {
      return res.status(403).json({ code: 403, message: '司机信息未完善，无法进行此操作' })
    }
  }
  next()
}
