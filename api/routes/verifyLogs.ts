import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const page = Number(req.query.page) || 1
  const pageSize = Number(req.query.page_size) || 20
  const targetType = req.query.target_type as string
  const targetId = req.query.target_id as string

  const conditions: string[] = []
  const params: any[] = []
  if (targetType) { conditions.push('target_type = ?'); params.push(targetType) }
  if (targetId) { conditions.push('target_id = ?'); params.push(targetId) }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
  const total = (db.prepare(`SELECT COUNT(*) as count FROM verify_logs ${whereClause}`).get(...params) as any).count
  const offset = (page - 1) * pageSize
  const logs = db.prepare(`SELECT * FROM verify_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset)
  res.json({ success: true, data: { list: logs, total, page, page_size: pageSize } })
})

export default router
