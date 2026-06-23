import { type Request, type Response, type NextFunction } from 'express'
import type { UserRole } from '../../shared/types.js'

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  courier: [
    'waybill:create',
    'waybill:read',
    'waybill:list:self',
    'authentication:perform',
    'exception:report',
    'order:read:self',
    'profile:read',
    'profile:update',
  ],
  outlet_admin: [
    'waybill:create',
    'waybill:read',
    'waybill:list:outlet',
    'authentication:perform',
    'exception:read',
    'exception:review',
    'exception:list:outlet',
    'user:read:outlet',
    'user:create:outlet',
    'user:update:outlet',
    'statistics:read:outlet',
    'audit:read:outlet',
    'order:read:outlet',
    'order:feedback',
    'profile:read',
    'profile:update',
  ],
  regional_supervisor: [
    'waybill:read',
    'waybill:list:region',
    'exception:read',
    'exception:review',
    'exception:list:region',
    'user:read:region',
    'user:create:outlet_admin',
    'user:update:region',
    'statistics:read:region',
    'audit:read:region',
    'audit:login:read:region',
    'order:read:region',
    'order:create',
    'order:update',
    'order:review',
    'profile:read',
    'profile:update',
  ],
  head_auditor: [
    'waybill:read',
    'waybill:list:all',
    'exception:read',
    'exception:list:all',
    'user:read:all',
    'user:create:all',
    'user:update:all',
    'user:delete',
    'user:permissions',
    'statistics:read:all',
    'audit:read:all',
    'audit:login:read:all',
    'order:read:all',
    'order:create',
    'order:update',
    'order:review:all',
    'system:config',
    'profile:read',
    'profile:update',
  ],
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  courier: 1,
  outlet_admin: 2,
  regional_supervisor: 3,
  head_auditor: 4,
}

export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  if (!permissions) return false
  return permissions.includes(permission)
}

export function hasAnyPermission(role: UserRole, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(role, p))
}

export function hasAllPermissions(role: UserRole, permissions: string[]): boolean {
  return permissions.every((p) => hasPermission(role, p))
}

export function isRoleAboveOrEqual(currentRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[targetRole]
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '用户未登录',
      })
      return
    }

    if (!hasPermission(req.user.role, permission)) {
      res.status(403).json({
        success: false,
        error: '权限不足，无法执行该操作',
      })
      return
    }

    next()
  }
}

export function requireAnyPermission(permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '用户未登录',
      })
      return
    }

    if (!hasAnyPermission(req.user.role, permissions)) {
      res.status(403).json({
        success: false,
        error: '权限不足，无法执行该操作',
      })
      return
    }

    next()
  }
}

export function requireRole(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '用户未登录',
      })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `该操作需要以下角色之一：${roles.join('、')}`,
      })
      return
    }

    next()
  }
}

export function requireRoleAboveOrEqual(minimumRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '用户未登录',
      })
      return
    }

    if (!isRoleAboveOrEqual(req.user.role, minimumRole)) {
      res.status(403).json({
        success: false,
        error: '权限不足，无法执行该操作',
      })
      return
    }

    next()
  }
}
