import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import crypto from 'crypto'

const router = Router()

router.get('/keys', (req: Request, res: Response): void => {
  const db = getDb()
  const keys = db.prepare('SELECT * FROM api_keys ORDER BY id').all()

  res.json({ success: true, data: keys })
})

router.post('/keys', (req: Request, res: Response): void => {
  const db = getDb()
  const { name, org, permissions } = req.body

  if (!name) {
    res.status(400).json({ success: false, error: 'Missing required field: name' })
    return
  }

  const key = 'sk_' + crypto.randomBytes(24).toString('hex')
  const result = db.prepare(
    'INSERT INTO api_keys (name, key, org, permissions, call_count, status) VALUES (?, ?, ?, ?, 0, ?)'
  ).run(name, key, org || null, permissions || 'read', 'active')

  const created = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: created })
})

router.delete('/keys/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(req.params.id)

  if (!existing) {
    res.status(404).json({ success: false, error: 'API key not found' })
    return
  }

  db.prepare('DELETE FROM api_keys WHERE id = ?').run(req.params.id)
  res.json({ success: true, data: { id: Number(req.params.id) } })
})

router.get('/stats', (req: Request, res: Response): void => {
  const db = getDb()

  const totalKeys = (db.prepare('SELECT COUNT(*) as count FROM api_keys').get() as { count: number }).count
  const activeKeys = (db.prepare("SELECT COUNT(*) as count FROM api_keys WHERE status = 'active'").get() as { count: number }).count
  const totalCalls = (db.prepare('SELECT COALESCE(SUM(call_count), 0) as total FROM api_keys').get() as { total: number }).total

  const byOrg = db.prepare(
    'SELECT org, COUNT(*) as key_count, SUM(call_count) as total_calls FROM api_keys GROUP BY org ORDER BY total_calls DESC'
  ).all()

  const topKeys = db.prepare(
    'SELECT name, org, call_count, status FROM api_keys ORDER BY call_count DESC LIMIT 10'
  ).all()

  res.json({
    success: true,
    data: {
      total_keys: totalKeys,
      active_keys: activeKeys,
      total_calls: totalCalls,
      by_org: byOrg,
      top_keys: topKeys,
    },
  })
})

export default router
