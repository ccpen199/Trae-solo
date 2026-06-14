import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/bureaus/list', (_req: Request, res: Response): void => {
  const bureaus = db.prepare('SELECT DISTINCT bureau FROM services ORDER BY bureau').all()
  res.json({ success: true, data: bureaus.map((b: any) => b.bureau) })
})

router.get('/', (req: Request, res: Response): void => {
  const conditions: string[] = []
  const params: any[] = []

  if (req.query.bureau) {
    conditions.push('bureau = ?')
    params.push(req.query.bureau)
  }
  if (req.query.category) {
    conditions.push('category = ?')
    params.push(req.query.category)
  }
  if (req.query.keyword) {
    conditions.push('(name LIKE ? OR description LIKE ?)')
    params.push(`%${req.query.keyword}%`, `%${req.query.keyword}%`)
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const list = db.prepare(`SELECT * FROM services ${where} ORDER BY sort_order, id`).all(...params)

  res.json({ success: true, data: list })
})

router.get('/:id', (req: Request, res: Response): void => {
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id) as any
  if (!service) {
    res.status(404).json({ success: false, error: 'Service not found' })
    return
  }
  res.json({ success: true, data: service })
})

router.post('/', (req: Request, res: Response): void => {
  const { name, bureau, api_endpoint, description, icon, category } = req.body
  if (!name || !bureau) {
    res.status(400).json({ success: false, error: 'name and bureau are required' })
    return
  }

  const result = db.prepare(
    `INSERT INTO services (name, bureau, api_endpoint, description, icon, category) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(name, bureau, api_endpoint || null, description || null, icon || null, category || null)

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: service })
})

router.put('/:id', (req: Request, res: Response): void => {
  const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'Service not found' })
    return
  }

  const { name, bureau, api_endpoint, description, icon, category, status } = req.body
  db.prepare(
    `UPDATE services SET name = COALESCE(?, name), bureau = COALESCE(?, bureau), api_endpoint = COALESCE(?, api_endpoint),
     description = COALESCE(?, description), icon = COALESCE(?, icon), category = COALESCE(?, category), status = COALESCE(?, status) WHERE id = ?`
  ).run(name ?? null, bureau ?? null, api_endpoint ?? null, description ?? null, icon ?? null, category ?? null, status ?? null, req.params.id)

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: service })
})

router.post('/apply', (req: Request, res: Response): void => {
  const { user_id, service_id, form_data, materials } = req.body
  if (!user_id || !service_id) {
    res.status(400).json({ success: false, error: 'user_id and service_id are required' })
    return
  }

  const initProgress = [
    { status: 'submitted', description: '申请已提交，等待受理', operator: '系统', time: new Date().toISOString() }
  ]

  const result = db.prepare(
    `INSERT INTO service_applications (user_id, service_id, form_data, materials, progress_logs, status) 
     VALUES (?, ?, ?, ?, ?, 'submitted')`
  ).run(
    user_id, 
    service_id, 
    typeof form_data === 'string' ? form_data : JSON.stringify(form_data || {}),
    materials ? JSON.stringify(materials) : null,
    JSON.stringify(initProgress)
  )

  const application = db.prepare('SELECT * FROM service_applications WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: application })
})

router.get('/applications/user/:user_id', (req: Request, res: Response): void => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 10))
  const offset = (page - 1) * pageSize

  const total = (db.prepare('SELECT COUNT(*) as count FROM service_applications WHERE user_id = ?').get(req.params.user_id) as any).count
  const list = db.prepare(`
    SELECT sa.*, s.name as service_name, s.bureau as service_bureau
    FROM service_applications sa
    JOIN services s ON sa.service_id = s.id
    WHERE sa.user_id = ?
    ORDER BY sa.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.params.user_id, pageSize, offset)

  res.json({ success: true, data: { list, total, page, pageSize } })
})

router.get('/applications/:id', (req: Request, res: Response): void => {
  const app = db.prepare(`
    SELECT sa.*, s.name as service_name, s.bureau as service_bureau, s.description as service_desc
    FROM service_applications sa
    JOIN services s ON sa.service_id = s.id
    WHERE sa.id = ?
  `).get(req.params.id) as any

  if (!app) {
    res.status(404).json({ success: false, error: 'Application not found' })
    return
  }

  if (app.progress_logs) {
    try { app.progress_logs = JSON.parse(app.progress_logs) } catch(e) {}
  }
  if (app.materials) {
    try { app.materials = JSON.parse(app.materials) } catch(e) {}
  }
  if (app.receipt) {
    try { app.receipt = JSON.parse(app.receipt) } catch(e) {}
  }
  if (app.feedback) {
    try { app.feedback = JSON.parse(app.feedback) } catch(e) {}
  }
  if (app.form_data) {
    try { app.form_data = JSON.parse(app.form_data) } catch(e) {}
  }

  res.json({ success: true, data: app })
})

router.put('/applications/:id/progress', (req: Request, res: Response): void => {
  const { status, description, operator } = req.body
  if (!status) {
    res.status(400).json({ success: false, error: 'status is required' })
    return
  }

  const existing = db.prepare('SELECT * FROM service_applications WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'Application not found' })
    return
  }

  let progressLogs: any[] = []
  if (existing.progress_logs) {
    try { progressLogs = JSON.parse(existing.progress_logs) } catch(e) {}
  }

  progressLogs.push({
    status,
    description,
    operator: operator || '部门经办人',
    time: new Date().toISOString()
  })

  db.prepare(`
    UPDATE service_applications 
    SET status = ?, progress_logs = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(status, JSON.stringify(progressLogs), req.params.id)

  const app = db.prepare('SELECT * FROM service_applications WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: app })
})

router.put('/applications/:id/receipt', (req: Request, res: Response): void => {
  const { receipt_no, content, handler, department } = req.body

  const existing = db.prepare('SELECT * FROM service_applications WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'Application not found' })
    return
  }

  const receipt = {
    receipt_no: receipt_no || `REC-${Date.now()}`,
    content,
    handler: handler || '经办人',
    department,
    issued_at: new Date().toISOString()
  }

  db.prepare(`
    UPDATE service_applications 
    SET receipt = ?, status = 'accepted', updated_at = datetime('now')
    WHERE id = ?
  `).run(JSON.stringify(receipt), req.params.id)

  const app = db.prepare('SELECT * FROM service_applications WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: app })
})

router.put('/applications/:id/complete', (req: Request, res: Response): void => {
  const { result, feedback_content } = req.body

  const existing = db.prepare('SELECT * FROM service_applications WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'Application not found' })
    return
  }

  let progressLogs: any[] = []
  if (existing.progress_logs) {
    try { progressLogs = JSON.parse(existing.progress_logs) } catch(e) {}
  }

  progressLogs.push({
    status: 'completed',
    description: result || '事项已办结',
    operator: '部门经办人',
    time: new Date().toISOString()
  })

  const feedback = feedback_content ? {
    content: feedback_content,
    created_at: new Date().toISOString()
  } : null

  db.prepare(`
    UPDATE service_applications 
    SET status = 'completed', result = ?, feedback = ?, progress_logs = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(result || '已办结', feedback ? JSON.stringify(feedback) : null, JSON.stringify(progressLogs), req.params.id)

  const app = db.prepare('SELECT * FROM service_applications WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: app })
})

export default router
