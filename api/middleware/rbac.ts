import type { Request, Response, NextFunction } from 'express'
import type { UserRole } from '@shared/types'

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '请先登录',
      })
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `权限不足，需要角色：${allowedRoles.join('、')}`,
      })
      return
    }

    next()
  }
}

export function requireOwner(req: Request, res: Response, next: NextFunction): void {
  return requireRole('owner')(req, res, next)
}

export function requireDoctor(req: Request, res: Response, next: NextFunction): void {
  return requireRole('doctor')(req, res, next)
}

export function requireHospital(req: Request, res: Response, next: NextFunction): void {
  return requireRole('hospital')(req, res, next)
}

export function requireMerchant(req: Request, res: Response, next: NextFunction): void {
  return requireRole('merchant')(req, res, next)
}

export function requireAnyRole(...roles: UserRole[]) {
  return requireRole(...roles)
}
