import type { Request, Response, NextFunction } from 'express'

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }
  try {
    const token = authHeader.slice(7)
    const decoded = Buffer.from(token, 'base64').toString()
    const user = JSON.parse(decoded)
    req.user = user
    next()
  } catch (e) {
    res.status(401).json({ success: false, error: 'Token无效' })
  }
}

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ success: false, error: '无权限' })
    return
  }
  next()
}

export function organizerOrAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'organizer' && req.user.role !== 'admin')) {
    res.status(403).json({ success: false, error: '无权限' })
    return
  }
  next()
}
