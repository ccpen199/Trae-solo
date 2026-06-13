import { Request, Response, NextFunction } from 'express'
import { verifyToken, JwtPayload } from '../utils/auth'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权访问' })
  }
  
  const token = authHeader.slice(7)
  const payload = verifyToken(token)
  
  if (!payload) {
    return res.status(401).json({ error: 'Token无效或已过期' })
  }
  
  req.user = payload
  next()
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: '需要管理员权限' })
  }
  next()
}

export function providerMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'PROVIDER' && req.user.role !== 'BOTH' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ error: '需要服务商权限' })
  }
  next()
}
