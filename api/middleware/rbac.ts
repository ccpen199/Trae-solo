import { type Request, type Response, type NextFunction } from 'express'

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: '未认证' })
      return
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: '权限不足' })
      return
    }
    next()
  }
}

export function requireOrg(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: '未认证' })
    return
  }
  if (['admin', 'ops'].includes(req.user.role)) {
    next()
    return
  }
  const targetOrgId = req.body.org_id ?? req.query.org_id ?? req.params.org_id
  if (targetOrgId && Number(targetOrgId) !== req.user.org_id) {
    res.status(403).json({ success: false, error: '无权访问该组织数据' })
    return
  }
  next()
}

export function requireSelfOrRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: '未认证' })
      return
    }
    if (roles.includes(req.user.role)) {
      next()
      return
    }
    const targetUserId = req.params.userId ?? req.params.id ?? req.body.user_id
    if (targetUserId && Number(targetUserId) === req.user.id) {
      next()
      return
    }
    res.status(403).json({ success: false, error: '只能操作自己的资源' })
  }
}
