import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/records', auth, (req: Request, res: Response): void => {
  const db = getDb()
  const page = parseInt(req.query.page as string) || 1
  const pageSize = 10
  const offset = (page - 1) * pageSize

  let countSql = 'SELECT COUNT(*) as total FROM business_records WHERE user_id = ?'
  let sql = 'SELECT * FROM business_records WHERE user_id = ?'
  const params: any[] = [req.user!.userId]

  if (req.query.status) {
    countSql += ' AND detail LIKE ?'
    sql += ' AND detail LIKE ?'
    params.push(`%${req.query.status}%`)
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'

  const { total } = db.prepare(countSql).get(...params) as { total: number }
  const records = db.prepare(sql).all(...params, pageSize, offset)

  res.json({
    ok: true,
    records,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
})

router.get('/sync-status', auth, (req: Request, res: Response): void => {
  const db = getDb()
  const conflicts = db.prepare(
    'SELECT COUNT(*) as count FROM sync_conflicts WHERE user_id = ? AND resolution IS NULL'
  ).get(req.user!.userId) as { count: number }

  const syncInfo = {
    lastSyncTime: new Date().toISOString(),
    status: conflicts.count > 0 ? 'has_conflicts' : 'synced',
    conflictCount: conflicts.count,
    pendingItems: 0,
  }

  res.json({ ok: true, syncInfo })
})

router.post('/sync/resolve', auth, (req: Request, res: Response): void => {
  const { conflictId, resolution } = req.body
  if (!conflictId || !resolution || !['local', 'remote'].includes(resolution)) {
    res.status(400).json({ ok: false, error: '缺少必要字段或解决方案无效' })
    return
  }

  const db = getDb()
  const conflict = db.prepare(
    'SELECT * FROM sync_conflicts WHERE id = ? AND user_id = ?'
  ).get(conflictId, req.user!.userId) as any

  if (!conflict) {
    res.status(404).json({ ok: false, error: '冲突记录不存在' })
    return
  }

  db.prepare(
    'UPDATE sync_conflicts SET resolution = ? WHERE id = ?'
  ).run(resolution, conflictId)

  res.json({ ok: true })
})

export default router
