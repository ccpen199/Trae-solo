import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 10))
  const offset = (page - 1) * pageSize

  const conditions: string[] = []
  const params: any[] = []

  if (req.query.level) {
    conditions.push('level = ?')
    params.push(req.query.level)
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const total = (db.prepare(`SELECT COUNT(*) as count FROM creator_credits ${where}`).get(...params) as any).count
  const list = db.prepare(
    `SELECT cc.*, u.username, u.display_name FROM creator_credits cc JOIN users u ON cc.user_id = u.id ${where} ORDER BY cc.score DESC LIMIT ? OFFSET ?`
  ).all(...params, pageSize, offset)

  res.json({ success: true, data: { list, total, page, pageSize } })
})

router.get('/:userId', (req: Request, res: Response): void => {
  const credit = db.prepare(
    'SELECT cc.*, u.username, u.display_name FROM creator_credits cc JOIN users u ON cc.user_id = u.id WHERE cc.user_id = ?'
  ).get(req.params.userId) as any
  if (!credit) {
    res.status(404).json({ success: false, error: 'Credit record not found' })
    return
  }

  const logs = db.prepare('SELECT * FROM credit_logs WHERE user_id = ? ORDER BY created_at DESC').all(req.params.userId)
  res.json({ success: true, data: { ...credit, credit_logs: logs } })
})

router.post('/adjust', (req: Request, res: Response): void => {
  const { user_id, delta, reason, operator_id } = req.body
  if (!user_id || delta === undefined || !reason) {
    res.status(400).json({ success: false, error: 'user_id, delta and reason are required' })
    return
  }

  const credit = db.prepare('SELECT * FROM creator_credits WHERE user_id = ?').get(user_id) as any
  if (!credit) {
    res.status(404).json({ success: false, error: 'Credit record not found' })
    return
  }

  const newScore = Math.max(0, credit.score + delta)
  const newLevel = newScore >= 90 ? 'excellent' : newScore >= 75 ? 'good' : newScore >= 60 ? 'normal' : newScore >= 40 ? 'warning' : 'banned'

  const adjust = db.transaction(() => {
    db.prepare("UPDATE creator_credits SET score = ?, level = ?, violation_count = violation_count + CASE WHEN delta < 0 THEN 1 ELSE 0 END, updated_at = datetime('now') WHERE user_id = ?").run(newScore, newLevel, user_id)
    db.prepare(
      `INSERT INTO credit_logs (user_id, delta, reason, operator_id) VALUES (?, ?, ?, ?)`
    ).run(user_id, delta, reason, operator_id || null)
  })

  adjust()
  const updated = db.prepare('SELECT * FROM creator_credits WHERE user_id = ?').get(user_id)
  res.json({ success: true, data: updated })
})

export default router
