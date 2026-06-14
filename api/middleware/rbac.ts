import { type Request, type Response, type NextFunction } from 'express'
import db from '../database.js'

const ROLE_HIERARCHY: Record<string, number> = {
  group_admin: 5,
  branch_admin: 4,
  dispatcher: 3,
  safety_officer: 2,
  api_consumer: 1,
}

export function rbacMiddleware(requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: '未认证' })
      return
    }
    const userRoleLevel = ROLE_HIERARCHY[req.user.role] || 0
    const hasRole = requiredRoles.some((role) => {
      const requiredLevel = ROLE_HIERARCHY[role] || 0
      return userRoleLevel >= requiredLevel
    })
    if (!hasRole) {
      res.status(403).json({ success: false, error: '权限不足' })
      return
    }
    next()
  }
}

export function orgScope(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next()
    return
  }
  const userOrgId = req.user.orgId
  const orgIds = getDescendantOrgIds(userOrgId)
  orgIds.push(userOrgId)
  ;(req as any).orgScopeIds = orgIds
  next()
}

function getDescendantOrgIds(parentId: number): number[] {
  const children = db.prepare('SELECT id FROM organizations WHERE parent_id = ?').all(parentId) as any[]
  const ids: number[] = []
  for (const child of children) {
    ids.push(child.id)
    ids.push(...getDescendantOrgIds(child.id))
  }
  return ids
}
