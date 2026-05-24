import { type Request, type Response, type NextFunction } from 'express'
import { query } from '../config/database.js'
import { errorResponse } from '../utils/response.js'

export function requirePermission(resource: string, action: string) {
  return function (req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json(errorResponse('用户未认证', 401))
      return
    }

    const { role } = req.user

    const permissions = query<{ id: number }>(
      'SELECT id FROM permissions WHERE role = ? AND resource = ? AND action = ?',
      [role, resource, action]
    )

    if (permissions.length === 0) {
      res.status(403).json(errorResponse('无权限执行此操作', 403))
      return
    }

    next()
  }
}
