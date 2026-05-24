import { type Request, type Response, type NextFunction } from 'express'
import { run } from '../config/database.js'

function parseAction(req: Request): string {
  const method = req.method
  if (method === 'GET') return 'read'
  if (method === 'POST') return 'create'
  if (method === 'PUT' || method === 'PATCH') return 'update'
  if (method === 'DELETE') return 'delete'
  return method.toLowerCase()
}

function parseResourceType(path: string): string {
  const parts = path.split('/').filter(p => p && p !== 'api')
  if (parts.length === 0) return 'unknown'
  return parts[0]
}

function parseResourceId(path: string): number | undefined {
  const match = path.match(/\/(\d+)(?:\/|$)/)
  if (match) {
    return parseInt(match[1], 10)
  }
  return undefined
}

export function auditLog(req: Request, res: Response, next: NextFunction): void {
  const userId = req.user?.userId
  const role = req.user?.role || 'anonymous'
  const action = parseAction(req)
  const resourceType = parseResourceType(req.path)
  const resourceId = parseResourceId(req.path)
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown'
  const userAgent = req.headers['user-agent'] || 'unknown'

  res.on('finish', () => {
    if (userId) {
      setTimeout(() => {
        try {
          run(
            'INSERT INTO audit_logs (user_id, role, action, resource_type, resource_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, role, action, resourceType, resourceId, ipAddress, userAgent]
          )
        } catch (error) {
          console.error('Failed to write audit log:', error)
        }
      }, 0)
    }
  })

  next()
}
