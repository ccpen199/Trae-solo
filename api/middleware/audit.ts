import { type Request, type Response, type NextFunction } from 'express'
import db from '../db.js'

export function auditLog(action: string, resourceType: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalEnd = res.end

    res.end = function (this: Response, ...args: any[]) {
      if (res.statusCode < 400) {
        const resourceId = req.params.id ? Number(req.params.id) : null
        const detail = JSON.stringify({
          method: req.method,
          path: req.path,
          body: req.method !== 'GET' ? req.body : undefined,
        })

        try {
          db.prepare(
            `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, detail, ip)
             VALUES (?, ?, ?, ?, ?, ?)`
          ).run(
            req.user?.id ?? null,
            action,
            resourceType,
            resourceId,
            detail,
            req.ip || null
          )
        } catch {
          // audit log failure should not block the response
        }
      }

      return originalEnd.apply(this, args)
    }

    next()
  }
}
