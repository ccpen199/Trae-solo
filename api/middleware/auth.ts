import jwt from 'jsonwebtoken'
import { type Request, type Response, type NextFunction } from 'express'

const JWT_SECRET = process.env.JWT_SECRET || 'realestate-saas-secret-key-2024'

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未提供认证令牌' })
    return
  }

  const token = authHeader.slice(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number
      username: string
      role: string
      org_id: number
    }
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      org_id: decoded.org_id,
    }
    next()
  } catch {
    res.status(401).json({ success: false, error: '令牌无效或已过期' })
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next()
    return
  }

  const token = authHeader.slice(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number
      username: string
      role: string
      org_id: number
    }
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      org_id: decoded.org_id,
    }
  } catch {
    // token invalid, but continue without user
  }
  next()
}

export { JWT_SECRET }
