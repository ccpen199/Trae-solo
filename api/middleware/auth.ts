import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { User } from '@shared/types'

declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

export interface JwtPayload {
  userId: string
  role: User['role']
}

const JWT_SECRET = process.env.JWT_SECRET || 'petlife-dev-secret-change-me'

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null

  if (!token) {
    res.status(401).json({
      success: false,
      error: '未提供认证令牌',
    })
    return
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & { user: User }
    req.user = decoded.user
    next()
  } catch (err) {
    res.status(403).json({
      success: false,
      error: '无效或已过期的令牌',
    })
  }
}

export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & { user: User }
      req.user = decoded.user
    } catch (err) {
      // token 无效时继续，但不挂载 user
    }
  }
  next()
}
