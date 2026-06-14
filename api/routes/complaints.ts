import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/stats/overview', (_req: Request, res: Response): void => {
  const byStatus = db.prepare("SELECT status, COUNT(*) as count FROM complaints GROUP BY status").all()
  const byPriority = db.prepare("SELECT priority, COUNT(*) as count FROM complaints GROUP BY priority").all()
  res.json({ success: true, data: { by_status: byStatus, by_priority: byPriority } })
})

router.get('/', (req: Request, res: Response): void => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 10))
  const offset = (page - 1) * pageSize

  const conditions: string[] = []
  const params: any[] = []

  if (req.query.status) {
    conditions.push('status = ?')
    params.push(req.query.status)
  }
  if (req.query.priority) {
    conditions.push('priority = ?')
    params.push(req.query.priority)
  }
  if (req.query.category) {
    conditions.push('category = ?')
    params.push(req.query.category)
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const total = (db.prepare(`SELECT COUNT(*) as count FROM complaints ${where}`).get(...params) as any).count
  const list = db.prepare(`SELECT * FROM complaints ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset)

  res.json({ success: true, data: { list, total, page, pageSize } })
})

router.get('/:id', (req: Request, res: Response): void => {
  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id) as any
  if (!complaint) {
    res.status(404).json({ success: false, error: 'Complaint not found' })
    return
  }

  const dispatches = db.prepare('SELECT * FROM complaint_dispatches WHERE complaint_id = ? ORDER BY dispatched_at').all(req.params.id)
  const progress = db.prepare('SELECT * FROM complaint_progress WHERE complaint_id = ? ORDER BY created_at').all(req.params.id)
  const surveys = db.prepare('SELECT * FROM satisfaction_surveys WHERE complaint_id = ?').all(req.params.id)
  res.json({ success: true, data: { ...complaint, dispatches, progress, surveys } })
})

router.post('/', (req: Request, res: Response): void => {
  const { user_id, title, content, category, priority } = req.body
  if (!user_id || !title || !content) {
    res.status(400).json({ success: false, error: 'user_id, title and content are required' })
    return
  }

  const result = db.prepare(
    `INSERT INTO complaints (user_id, title, content, category, priority, status) VALUES (?, ?, ?, ?, ?, 'submitted')`
  ).run(user_id, title, content, category || null, priority || 'normal')

  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: complaint })
})

router.post('/:id/dispatch', (req: Request, res: Response): void => {
  const { handler_id, department, instruction } = req.body
  if (!handler_id || !department) {
    res.status(400).json({ success: false, error: 'handler_id and department are required' })
    return
  }

  const existing = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'Complaint not found' })
    return
  }

  const dispatch = db.transaction(() => {
    db.prepare("UPDATE complaints SET assigned_department = ?, assigned_handler = ?, status = 'dispatched', updated_at = datetime('now') WHERE id = ?").run(department, String(handler_id), req.params.id)
    db.prepare(
      `INSERT INTO complaint_dispatches (complaint_id, handler_id, department, instruction) VALUES (?, ?, ?, ?)`
    ).run(Number(req.params.id), handler_id, department, instruction || null)
    db.prepare(
      `INSERT INTO complaint_progress (complaint_id, status, description, operator_id) VALUES (?, 'dispatched', ?, ?)`
    ).run(Number(req.params.id), instruction || `已派单至${department}`, handler_id)
  })

  dispatch()
  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: complaint })
})

router.post('/:id/progress', (req: Request, res: Response): void => {
  const { status, description, evidence_hash, operator_id } = req.body
  if (!status || !description) {
    res.status(400).json({ success: false, error: 'status and description are required' })
    return
  }

  const existing = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'Complaint not found' })
    return
  }

  const updateProgress = db.transaction(() => {
    db.prepare("UPDATE complaints SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id)
    db.prepare(
      `INSERT INTO complaint_progress (complaint_id, status, description, evidence_hash, operator_id) VALUES (?, ?, ?, ?, ?)`
    ).run(Number(req.params.id), status, description, evidence_hash || null, operator_id || null)
  })

  updateProgress()
  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: complaint })
})

router.post('/:id/satisfaction', (req: Request, res: Response): void => {
  const { rating, comment, user_id } = req.body
  if (!rating || !user_id) {
    res.status(400).json({ success: false, error: 'rating and user_id are required' })
    return
  }

  const existing = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'Complaint not found' })
    return
  }

  db.prepare(
    `INSERT INTO satisfaction_surveys (complaint_id, user_id, rating, comment) VALUES (?, ?, ?, ?)`
  ).run(Number(req.params.id), user_id, rating, comment || null)

  res.json({ success: true, data: { complaint_id: Number(req.params.id), rating, comment } })
})

export default router
