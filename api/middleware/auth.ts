import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { JwtPayload, UserRole } from '../../shared/types.js'

const JWT_SECRET = process.env.JWT_SECRET || 'internship-platform-secret-key-2024'

export function signToken(payload: Pick<JwtPayload, 'userId' | 'email' | 'role'>, expiresIn: string = '7d'): string {
  return jwt.sign(payload as object, JWT_SECRET, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] })
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export function auth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || req.headers.Authorization as string | undefined

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: '未提供认证令牌，请先登录',
    })
    return
  }

  const token = authHeader.slice(7)
  const payload = verifyToken(token)

  if (!payload) {
    res.status(401).json({
      success: false,
      error: '认证令牌无效或已过期，请重新登录',
    })
    return
  }

  req.user = payload
  next()
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '请先登录',
      })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `权限不足，需要角色: ${roles.join(' 或 ')}`,
      })
      return
    }

    next()
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || req.headers.Authorization as string | undefined

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const payload = verifyToken(token)
    if (payload) {
      req.user = payload
    }
  }

  next()
}

export default auth
