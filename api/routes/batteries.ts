import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 10))
  const offset = (page - 1) * pageSize

  const conditions: string[] = []
  const params: any[] = []

  if (req.query.code) {
    conditions.push('code LIKE ?')
    params.push(`%${req.query.code}%`)
  }
  if (req.query.model) {
    conditions.push('model LIKE ?')
    params.push(`%${req.query.model}%`)
  }
  if (req.query.supplier) {
    conditions.push('supplier LIKE ?')
    params.push(`%${req.query.supplier}%`)
  }
  if (req.query.status) {
    conditions.push('status = ?')
    params.push(req.query.status)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const total = (db.prepare(`SELECT COUNT(*) as count FROM batteries ${whereClause}`).get(...params) as { count: number }).count
  const rows = db.prepare(`SELECT * FROM batteries ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset) as any[]

  const rowsWithRisk = rows.map(b => {
    const highAlerts = db.prepare(
      "SELECT COUNT(*) as count FROM safety_alerts WHERE battery_id = ? AND status IN ('open', 'reviewing') AND severity IN ('high', 'critical')"
    ).get(b.id) as { count: number }
    return { ...b, hasHighRiskAlerts: highAlerts.count > 0 }
  })

  res.json({ success: true, data: { list: rowsWithRisk, total, page, pageSize } })
})

router.get('/:id', (req: Request, res: Response): void => {
  const row = db.prepare('SELECT * FROM batteries WHERE id = ?').get(req.params.id) as Record<string, any> | undefined
  if (!row) {
    res.status(404).json({ success: false, error: '电池不存在' })
    return
  }
  const openAlerts = db.prepare(
    "SELECT id, alert_type, severity, status, description, alert_at FROM safety_alerts WHERE battery_id = ? AND status IN ('open', 'reviewing') AND severity IN ('high', 'critical')"
  ).all(req.params.id) as { id: string; alert_type: string; severity: string; status: string; description: string; alert_at: string }[]
  res.json({ success: true, data: { ...row, riskAlerts: openAlerts } })
})

router.post('/', (req: Request, res: Response): void => {
  const id = uuidv4()
  const { code, model, supplier, purchase_batch, capacity, warranty_date, initial_test_result, status } = req.body

  if (!code || !model || !supplier || !purchase_batch || capacity === undefined || !warranty_date) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }

  try {
    db.prepare(`
      INSERT INTO batteries (id, code, model, supplier, purchase_batch, capacity, warranty_date, initial_test_result, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, code, model, supplier, purchase_batch, capacity, warranty_date, initial_test_result || 'pass', status || 'in_stock')

    const row = db.prepare('SELECT * FROM batteries WHERE id = ?').get(id)
    res.status(201).json({ success: true, data: row })
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      res.status(409).json({ success: false, error: '电池编码已存在' })
      return
    }
    res.status(500).json({ success: false, error: '创建失败' })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  const existing = db.prepare('SELECT * FROM batteries WHERE id = ?').get(req.params.id)
  if (!existing) {
    res.status(404).json({ success: false, error: '电池不存在' })
    return
  }

  const openHighAlerts = db.prepare(
    "SELECT COUNT(*) as count FROM safety_alerts WHERE battery_id = ? AND status IN ('open', 'reviewing') AND severity IN ('high', 'critical')"
  ).get(req.params.id) as { count: number }
  if (openHighAlerts.count > 0) {
    res.status(403).json({ success: false, error: '该电池存在未处理的高风险告警，禁止编辑。请先处理安全告警。' })
    return
  }

  const fields: string[] = []
  const params: any[] = []

  const allowedFields = ['code', 'model', 'supplier', 'purchase_batch', 'capacity', 'warranty_date', 'initial_test_result', 'status']
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      fields.push(`${field} = ?`)
      params.push(req.body[field])
    }
  }

  if (fields.length === 0) {
    res.status(400).json({ success: false, error: '没有需要更新的字段' })
    return
  }

  fields.push("updated_at = datetime('now')")
  params.push(req.params.id)

  try {
    db.prepare(`UPDATE batteries SET ${fields.join(', ')} WHERE id = ?`).run(...params)
    const row = db.prepare('SELECT * FROM batteries WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: row })
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      res.status(409).json({ success: false, error: '电池编码已存在' })
      return
    }
    res.status(500).json({ success: false, error: '更新失败' })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  const existing = db.prepare('SELECT * FROM batteries WHERE id = ?').get(req.params.id)
  if (!existing) {
    res.status(404).json({ success: false, error: '电池不存在' })
    return
  }

  const openHighAlerts = db.prepare(
    "SELECT COUNT(*) as count FROM safety_alerts WHERE battery_id = ? AND status IN ('open', 'reviewing') AND severity IN ('high', 'critical')"
  ).get(req.params.id) as { count: number }
  if (openHighAlerts.count > 0) {
    res.status(403).json({ success: false, error: '该电池存在未处理的高风险告警，禁止删除。请先处理安全告警。' })
    return
  }

  db.prepare('DELETE FROM batteries WHERE id = ?').run(req.params.id)
  res.json({ success: true, data: null })
})

router.get('/:id/risk-status', (req: Request, res: Response): void => {
  const row = db.prepare('SELECT id, code, status FROM batteries WHERE id = ?').get(req.params.id)
  if (!row) {
    res.status(404).json({ success: false, error: '电池不存在' })
    return
  }
  const openAlerts = db.prepare(
    "SELECT id, alert_type, severity, status, description, alert_at FROM safety_alerts WHERE battery_id = ? AND status IN ('open', 'reviewing') AND severity IN ('high', 'critical')"
  ).all(req.params.id) as { id: string; alert_type: string; severity: string; status: string; description: string; alert_at: string }[]
  res.json({ success: true, data: { isHighRisk: openAlerts.length > 0, riskAlerts: openAlerts } })
})

export default router
