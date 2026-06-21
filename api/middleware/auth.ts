import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'

export interface AuthRequest extends Request {
  user?: {
    id: string
    username: string
    role: string
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'wenwan-art-appraisal-secret-key-2024'

export function signToken(payload: { id: string; username: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未授权访问' })
    return
  }
  const token = authHeader.slice(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: string }
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ success: false, error: 'Token 无效或已过期' })
  }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ success: false, error: '需要管理员权限' })
    return
  }
  next()
}

export function expertMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || (req.user.role !== 'expert' && req.user.role !== 'admin')) {
    res.status(403).json({ success: false, error: '需要专家权限' })
    return
  }
  next()
}
