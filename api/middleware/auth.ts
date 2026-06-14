import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        username: string
        role: string
        orgId: number
      }
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'vehicle_monitor_jwt_secret_2024'

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未提供认证令牌' })
    return
  }
  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      orgId: decoded.orgId,
    }
    next()
  } catch {
    res.status(401).json({ success: false, error: '令牌无效或已过期' })
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        orgId: decoded.orgId,
      }
    } catch {}
  }
  next()
}
