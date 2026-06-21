import { type Request, type Response, type NextFunction } from 'express'
import { auditLogs } from '../store/memory.js'
import type { AuditLog } from '../../shared/types.js'

const generateId = (): string => 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)

const auditMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const originalSend = res.send.bind(res)
  const start = Date.now()

  res.send = function (body: unknown): Response {
    const result = res.statusCode >= 200 && res.statusCode < 400 ? 'success' : 'fail'
    const urlParts = req.path.split('/').filter(Boolean)
    const module = urlParts[1] || 'unknown'
    const action = req.auditAction || `${req.method.toLowerCase()}_${urlParts.slice(2).join('_') || 'index'}`

    const log: AuditLog = {
      id: generateId(),
      userId: req.userId || 'anonymous',
      action,
      module: req.auditModule || module,
      ip: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
      ua: req.headers['user-agent'] || 'unknown',
      time: new Date().toISOString(),
      result,
      detail: `${req.method} ${req.path} ${res.statusCode} (${Date.now() - start}ms)`,
    }

    auditLogs.push(log)

    return originalSend(body)
  }

  next()
}

export default auditMiddleware
