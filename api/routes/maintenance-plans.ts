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

  if (req.query.battery_id) {
    conditions.push('battery_id = ?')
    params.push(req.query.battery_id)
  }
  if (req.query.trigger_type) {
    conditions.push('trigger_type = ?')
    params.push(req.query.trigger_type)
  }
  if (req.query.task_type) {
    conditions.push('task_type = ?')
    params.push(req.query.task_type)
  }
  if (req.query.status) {
    conditions.push('status = ?')
    params.push(req.query.status)
  }
  if (req.query.priority) {
    conditions.push('priority = ?')
    params.push(req.query.priority)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const total = (db.prepare(`SELECT COUNT(*) as count FROM maintenance_plans ${whereClause}`).get(...params) as { count: number }).count
  const rows = db.prepare(`SELECT * FROM maintenance_plans ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset)

  res.json({ success: true, data: { list: rows, total, page, pageSize } })
})

router.get('/:id', (req: Request, res: Response): void => {
  const row = db.prepare('SELECT * FROM maintenance_plans WHERE id = ?').get(req.params.id)
  if (!row) {
    res.status(404).json({ success: false, error: '维护计划不存在' })
    return
  }
  res.json({ success: true, data: row })
})

router.post('/', (req: Request, res: Response): void => {
  const id = uuidv4()
  const { battery_id, trigger_type, trigger_condition, task_type, status, priority, description, scheduled_at } = req.body

  if (!battery_id || !trigger_type || !trigger_condition || !task_type) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }

  const battery = db.prepare('SELECT id FROM batteries WHERE id = ?').get(battery_id)
  if (!battery) {
    res.status(400).json({ success: false, error: '电池不存在' })
    return
  }

  db.prepare(`
    INSERT INTO maintenance_plans (id, battery_id, trigger_type, trigger_condition, task_type, status, priority, description, scheduled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, battery_id, trigger_type, trigger_condition, task_type, status || 'pending', priority || 'medium', description || null, scheduled_at || null)

  const row = db.prepare('SELECT * FROM maintenance_plans WHERE id = ?').get(id)
  res.status(201).json({ success: true, data: row })
})

router.put('/:id', (req: Request, res: Response): void => {
  const existing = db.prepare('SELECT * FROM maintenance_plans WHERE id = ?').get(req.params.id)
  if (!existing) {
    res.status(404).json({ success: false, error: '维护计划不存在' })
    return
  }

  const fields: string[] = []
  const params: any[] = []

  const allowedFields = ['battery_id', 'trigger_type', 'trigger_condition', 'task_type', 'status', 'priority', 'description', 'scheduled_at', 'completed_at', 'completed_by', 'result']
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

  if (req.body.status === 'completed' && !req.body.completed_at) {
    fields.push("completed_at = datetime('now')")
  }

  params.push(req.params.id)
  db.prepare(`UPDATE maintenance_plans SET ${fields.join(', ')} WHERE id = ?`).run(...params)

  if (req.body.status === 'completed') {
    const plan = db.prepare('SELECT * FROM maintenance_plans WHERE id = ?').get(req.params.id) as any
    if (plan && plan.battery_id) {
      const openAlerts = db.prepare(
        "SELECT id FROM safety_alerts WHERE battery_id = ? AND status IN ('open', 'reviewing') AND severity IN ('high', 'critical')"
      ).all(plan.battery_id) as { id: string }[]
      const taskTypeDispMap: Record<string, string> = {
        inspect: '已完成检测，待评估结果',
        repair: '已完成维修，待复查确认',
        retire: '已执行退役流程',
        cascade: '已转入梯次利用评估',
      }
      const disposition = taskTypeDispMap[plan.task_type] || `已完成${plan.task_type}任务`
      const reviewer = plan.completed_by || null
      for (const alert of openAlerts) {
        db.prepare(`
          UPDATE safety_alerts SET status = 'reviewing', disposition = ?, resolution = COALESCE(resolution, ?), reviewer = COALESCE(reviewer, ?), reviewed_at = COALESCE(reviewed_at, datetime('now')) WHERE id = ?
        `).run(disposition, `关联维护计划 ${plan.id.slice(0,8)} 已完成: ${plan.result || disposition}`, reviewer, alert.id)
      }
    }
  }

  const row = db.prepare('SELECT * FROM maintenance_plans WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: row })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const existing = db.prepare('SELECT * FROM maintenance_plans WHERE id = ?').get(req.params.id)
  if (!existing) {
    res.status(404).json({ success: false, error: '维护计划不存在' })
    return
  }

  db.prepare('DELETE FROM maintenance_plans WHERE id = ?').run(req.params.id)
  res.json({ success: true, data: null })
})

export default router
