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
  if (req.query.alert_type) {
    conditions.push('alert_type = ?')
    params.push(req.query.alert_type)
  }
  if (req.query.severity) {
    conditions.push('severity = ?')
    params.push(req.query.severity)
  }
  if (req.query.status) {
    conditions.push('status = ?')
    params.push(req.query.status)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const total = (db.prepare(`SELECT COUNT(*) as count FROM safety_alerts ${whereClause}`).get(...params) as { count: number }).count
  const rows = db.prepare(`SELECT * FROM safety_alerts ${whereClause} ORDER BY alert_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset)

  res.json({ success: true, data: { list: rows, total, page, pageSize } })
})

router.get('/:id', (req: Request, res: Response): void => {
  const row = db.prepare('SELECT * FROM safety_alerts WHERE id = ?').get(req.params.id)
  if (!row) {
    res.status(404).json({ success: false, error: '安全告警不存在' })
    return
  }
  res.json({ success: true, data: row })
})

router.post('/', (req: Request, res: Response): void => {
  const id = uuidv4()
  const { battery_id, alert_type, severity, status, description, resolution, alert_at } = req.body

  if (!battery_id || !alert_type || !severity) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }

  const battery = db.prepare('SELECT id FROM batteries WHERE id = ?').get(battery_id)
  if (!battery) {
    res.status(400).json({ success: false, error: '电池不存在' })
    return
  }

  db.prepare(`
    INSERT INTO safety_alerts (id, battery_id, alert_type, severity, status, description, resolution, alert_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, battery_id, alert_type, severity, status || 'open', description || null, resolution || null, alert_at || null)

  const row = db.prepare('SELECT * FROM safety_alerts WHERE id = ?').get(id)
  res.status(201).json({ success: true, data: row })
})

router.put('/:id', (req: Request, res: Response): void => {
  const existing = db.prepare('SELECT * FROM safety_alerts WHERE id = ?').get(req.params.id)
  if (!existing) {
    res.status(404).json({ success: false, error: '安全告警不存在' })
    return
  }

  const fields: string[] = []
  const params: any[] = []

  if (req.body.status !== undefined) {
    fields.push('status = ?')
    params.push(req.body.status)
  }
  if (req.body.resolution !== undefined) {
    fields.push('resolution = ?')
    params.push(req.body.resolution)
  }
  if (req.body.disposition !== undefined) {
    fields.push('disposition = ?')
    params.push(req.body.disposition)
  }
  if (req.body.reviewer !== undefined) {
    fields.push('reviewer = ?')
    params.push(req.body.reviewer)
  }
  if (req.body.severity !== undefined) {
    fields.push('severity = ?')
    params.push(req.body.severity)
  }
  if (req.body.description !== undefined) {
    fields.push('description = ?')
    params.push(req.body.description)
  }

  if (req.body.status === 'resolved' && !req.body.resolved_at) {
    fields.push("resolved_at = datetime('now')")
  }
  if (req.body.resolved_at !== undefined) {
    fields.push('resolved_at = ?')
    params.push(req.body.resolved_at)
  }
  if (req.body.status === 'resolved' && !req.body.reviewed_at) {
    fields.push("reviewed_at = datetime('now')")
  }
  if (req.body.reviewed_at !== undefined) {
    fields.push('reviewed_at = ?')
    params.push(req.body.reviewed_at)
  }

  if (fields.length === 0) {
    res.status(400).json({ success: false, error: '没有需要更新的字段' })
    return
  }

  params.push(req.params.id)
  db.prepare(`UPDATE safety_alerts SET ${fields.join(', ')} WHERE id = ?`).run(...params)

  const row = db.prepare('SELECT * FROM safety_alerts WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: row })
})

export default router
