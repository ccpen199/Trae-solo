import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { JwtPayload, UserRole } from '../types/index.js'

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    res.status(401).json({
      code: 401,
      message: '未提供认证令牌',
      data: null,
      timestamp: Date.now(),
    })
    return
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      code: 401,
      message: '认证令牌格式错误',
      data: null,
      timestamp: Date.now(),
    })
    return
  }

  const token = parts[1]

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    req.user = decoded
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        code: 401,
        message: '认证令牌已过期',
        data: null,
        timestamp: Date.now(),
      })
      return
    }

    res.status(401).json({
      code: 401,
      message: '认证令牌无效',
      data: null,
      timestamp: Date.now(),
    })
  }
}

export const roleMiddleware = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        code: 401,
        message: '用户未认证',
        data: null,
        timestamp: Date.now(),
      })
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        code: 403,
        message: '权限不足，无法访问该资源',
        data: null,
        timestamp: Date.now(),
      })
      return
    }

    next()
  }
}

export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d',
  })
}

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export default authMiddleware
