import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

const router = Router()

router.get('/logs', authenticate, requireRole('director', 'admin', 'platform'), async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      action, resourceType, userId, startDate, endDate, page = '1', pageSize = '10',
    } = req.query as any

    const conditions: string[] = []
    const params: any[] = []

    if (action) { conditions.push('a.action = ?'); params.push(action) }
    if (resourceType) { conditions.push('a.resource_type = ?'); params.push(resourceType) }
    if (userId) { conditions.push('a.user_id = ?'); params.push(Number(userId)) }
    if (startDate) { conditions.push('a.created_at >= ?'); params.push(startDate) }
    if (endDate) { conditions.push('a.created_at <= ?'); params.push(endDate) }

    const pageNum = Math.max(1, Number(page))
    const pageSizeNum = Math.max(1, Math.min(100, Number(pageSize)))
    const offset = (pageNum - 1) * pageSizeNum
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''

    const totalRow = db.prepare(`SELECT COUNT(*) as count FROM audit_logs a ${where}`).get(...params) as { count: number }
    const rows = db.prepare(
      `SELECT a.*, u.name as user_name
       FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id
       ${where}
       ORDER BY a.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSizeNum, offset) as any[]

    res.json({ success: true, data: rows, total: totalRow.count, page: pageNum, pageSize: pageSizeNum })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/logs/:id', authenticate, requireRole('director', 'admin', 'platform'), async (req: Request, res: Response): Promise<void> => {
  try {
    const logId = Number(req.params.id)

    const log = db.prepare(
      `SELECT a.*, u.name as user_name
       FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id
       WHERE a.id = ?`
    ).get(logId) as any

    if (!log) {
      res.status(404).json({ success: false, error: '审计日志不存在' })
      return
    }

    if (log.detail) {
      try {
        log.detail = JSON.parse(log.detail)
      } catch {
        // keep original string if parse fails
      }
    }

    res.json({ success: true, data: log })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
