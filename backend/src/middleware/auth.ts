import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types'
import { verifyToken } from '../utils/jwt'
import { error } from '../utils/response'

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    error(res, '未登录或登录已过期', 401)
    return
  }

  const token = authHeader.slice(7)
  const payload = verifyToken(token)

  if (!payload) {
    error(res, 'Token无效或已过期', 401)
    return
  }

  req.user = payload
  next()
}

export function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const payload = verifyToken(token)
    if (payload) {
      req.user = payload
    }
  }

  next()
}
