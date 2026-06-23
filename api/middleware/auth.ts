import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { JwtPayload } from '../../shared/types.js'

const JWT_SECRET = process.env.JWT_SECRET || 'postal-regulatory-platform-jwt-secret-key-2024'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] })
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: '未提供认证令牌',
    })
    return
  }

  const token = authHeader.substring(7)
  const payload = verifyToken(token)

  if (!payload) {
    res.status(401).json({
      success: false,
      error: '认证令牌无效或已过期',
    })
    return
  }

  req.user = payload
  next()
}

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (payload) {
      req.user = payload
    }
  }

  next()
}
