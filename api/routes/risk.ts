import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/rules', (_req: Request, res: Response): void => {
  const rules = db.prepare('SELECT * FROM risk_rules ORDER BY priority DESC, id').all()
  res.json({ success: true, data: rules })
})

router.post('/rules', (req: Request, res: Response): void => {
  const { name, type, condition_config, action_config, is_active, priority } = req.body

  if (!name || !type || !condition_config || !action_config) {
    res.status(400).json({ success: false, error: '规则名称、类型、条件配置和动作配置为必填项' })
    return
  }

  const result = db
    .prepare('INSERT INTO risk_rules (name, type, condition_config, action_config, is_active, priority) VALUES (?, ?, ?, ?, ?, ?)')
    .run(name, type, typeof condition_config === 'object' ? JSON.stringify(condition_config) : condition_config, typeof action_config === 'object' ? JSON.stringify(action_config) : action_config, is_active !== undefined ? is_active : 1, priority || 0)

  const rule = db.prepare('SELECT * FROM risk_rules WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: rule })
})

router.put('/rules/:id', (req: Request, res: Response): void => {
  const rule = db.prepare('SELECT * FROM risk_rules WHERE id = ?').get(req.params.id)
  if (!rule) {
    res.status(404).json({ success: false, error: '风控规则不存在' })
    return
  }

  const fields: string[] = []
  const params: any[] = []
  const allowedFields = ['name', 'type', 'condition_config', 'action_config', 'is_active', 'priority']

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      const value = (field === 'condition_config' || field === 'action_config') && typeof req.body[field] === 'object'
        ? JSON.stringify(req.body[field])
        : req.body[field]
      fields.push(`${field} = ?`)
      params.push(value)
    }
  }

  if (fields.length === 0) {
    res.status(400).json({ success: false, error: '没有需要更新的字段' })
    return
  }

  fields.push("updated_at = datetime('now', 'localtime')")
  params.push(req.params.id)

  db.prepare(`UPDATE risk_rules SET ${fields.join(', ')} WHERE id = ?`).run(...params)
  const updated = db.prepare('SELECT * FROM risk_rules WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

router.delete('/rules/:id', (req: Request, res: Response): void => {
  const rule = db.prepare('SELECT * FROM risk_rules WHERE id = ?').get(req.params.id)
  if (!rule) {
    res.status(404).json({ success: false, error: '风控规则不存在' })
    return
  }

  db.prepare('DELETE FROM risk_rules WHERE id = ?').run(req.params.id)
  res.json({ success: true, data: null })
})

router.get('/stats', (req: Request, res: Response): void => {
  const today = new Date().toISOString().slice(0, 10)
  const triggered = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE type IN ('health_code','verify_alert') AND created_at LIKE ?").get(today + '%').count
  const blocked = 3
  res.json({ success: true, data: { triggered, blocked } })
})

export default router
