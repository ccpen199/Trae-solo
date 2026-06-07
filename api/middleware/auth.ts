import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import db from '../db.js'

const JWT_SECRET = 'estate-platform-jwt-secret-2024'

interface AuthRequest extends Request {
  user?: any
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: '未提供认证令牌' })
      return
    }

    const token = authHeader.slice(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any

    const user = db.prepare('SELECT id, username, role, phone, email, nickname, avatar, certification_type, certification_status FROM users WHERE id = ?').get(decoded.userId)
    if (!user) {
      res.status(401).json({ success: false, error: '用户不存在' })
      return
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ success: false, error: '认证令牌无效或已过期' })
  }
}

export default authMiddleware
