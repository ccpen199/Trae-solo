import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { errorResponse } from '../utils/response'
import { UserRole } from '../entities'

export interface JwtPayload {
  userId: string
  username: string
  role: UserRole
  iat?: number
  exp?: number
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(errorResponse('未授权访问', 401))
  }

  const token = authHeader.substring(7)

  try {
    const secret = process.env.JWT_SECRET || 'default-secret'
    const decoded = jwt.verify(token, secret) as JwtPayload
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json(errorResponse('Token无效或已过期', 401))
  }
}

export const roleMiddleware = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(errorResponse('未授权访问', 401))
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(errorResponse('权限不足', 403))
    }

    next()
  }
}

export const optionalAuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    try {
      const secret = process.env.JWT_SECRET || 'default-secret'
      const decoded = jwt.verify(token, secret) as JwtPayload
      req.user = decoded
    } catch (error) {
      // Token无效但可选，继续执行
    }
  }
  next()
}
