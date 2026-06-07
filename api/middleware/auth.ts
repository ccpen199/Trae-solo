import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'nj-gov-jwt-secret-2024'

interface JwtPayload {
  id: number
  phone: string
  role: string
}

export function generateToken(user: { id: number; phone: string; role: string }): string {
  return jwt.sign({ id: user.id, phone: user.phone, role: user.role } as JwtPayload, JWT_SECRET, { expiresIn: '7d' })
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ code: -1, message: '未提供认证令牌' })
    return
  }
  const token = authHeader.slice(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    ;(req as any).user = decoded
    next()
  } catch {
    res.status(401).json({ code: -1, message: '令牌无效或已过期' })
  }
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user
  if (!user || (user.role !== 'admin' && user.role !== 'operator')) {
    res.status(403).json({ code: -1, message: '权限不足' })
    return
  }
  next()
}
