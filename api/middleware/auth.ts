import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'community-governance-secret-2024'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        role_id: number
        organization_id: number
      }
    }
  }
}

export function auth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未提供认证令牌' })
    return
  }

  const token = header.slice(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number
      role_id: number
      organization_id: number
    }
    req.user = {
      id: decoded.id,
      role_id: decoded.role_id,
      organization_id: decoded.organization_id,
    }
    next()
  } catch {
    res.status(401).json({ success: false, error: '认证令牌无效或已过期' })
  }
}

export { JWT_SECRET }
