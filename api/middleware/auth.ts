import jwt from 'jsonwebtoken'
import { type Request, type Response, type NextFunction } from 'express'

const JWT_SECRET = process.env.JWT_SECRET || 'yunshuitong2026secret'

export interface AuthPayload {
  userId: string
  role: string
  phone: string
}

declare module 'express' {
  interface Request {
    user?: AuthPayload
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未登录或Token无效' })
    return
  }
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload
    decoded.userId = String(decoded.userId)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ success: false, error: 'Token已过期或无效' })
  }
}

export function roleMiddleware(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: '无权限访问' })
      return
    }
    next()
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
}
