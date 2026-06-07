import jwt from 'jsonwebtoken'
import { type Request, type Response, type NextFunction } from 'express'
import { getDb } from '../database.js'

const JWT_SECRET = process.env.JWT_SECRET || 'smart-locker-platform-secret-key-2024'

export interface AuthUser {
  id: string
  username: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export function generateToken(user: AuthUser): string {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未提供认证令牌' })
    return
  }

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
    const db = getDb()
    const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(decoded.id) as AuthUser | undefined
    if (!user) {
      res.status(401).json({ success: false, error: '用户不存在' })
      return
    }
    req.user = { id: user.id, username: user.username, role: user.role }
    next()
  } catch {
    res.status(401).json({ success: false, error: '令牌无效或已过期' })
  }
}

export function adminOnly(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'operator')) {
    res.status(403).json({ success: false, error: '权限不足，需要管理员或运营员权限' })
    return
  }
  next()
}
