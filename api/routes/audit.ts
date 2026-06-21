import { Router, type Request, type Response } from 'express'
import authMiddleware from '../middleware/auth.js'
import { auditLogs, incrementUsageCount } from '../store/memory.js'
import type { AuditLog } from '../../shared/types.js'

const router = Router()

router.get('/logs', authMiddleware(), async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || 'demo-user'
  incrementUsageCount(userId, 'audit')

  const { module, start, end, limit, offset } = req.query

  let logs = auditLogs.filter((log: AuditLog) => log.userId === userId)

  if (module) {
    logs = logs.filter((log: AuditLog) => log.module === module)
  }
  if (start) {
    logs = logs.filter((log: AuditLog) => log.time >= start)
  }
  if (end) {
    logs = logs.filter((log: AuditLog) => log.time <= end)
  }

  const limitNum = parseInt(limit as string, 10) || 50
  const offsetNum = parseInt(offset as string, 10) || 0
  const paginatedLogs = logs.slice(offsetNum, offsetNum + limitNum)

  req.auditAction = 'get_audit_logs'
  req.auditModule = 'audit'

  res.json({
    success: true,
    data: paginatedLogs,
    total: logs.length,
    page: Math.floor(offsetNum / limitNum) + 1,
    pageSize: limitNum,
  })
})

router.post('/log', authMiddleware(), async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || 'demo-user'
  const { action, module: mod, result, detail } = req.body

  const newLog: AuditLog = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    userId,
    action: action || 'custom',
    module: mod || 'custom',
    ip: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
    ua: req.headers['user-agent'] || 'unknown',
    time: new Date().toISOString(),
    result: result || 'success',
    detail,
  }

  auditLogs.push(newLog)

  req.auditAction = 'add_audit_log'
  req.auditModule = 'audit'

  res.json({
    success: true,
    data: { id: newLog.id },
  })
})

export default router
