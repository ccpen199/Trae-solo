import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../database.js'

const router = Router()

function formatAlert(row: Record<string, unknown>) {
  const chain = typeof row.notification_chain === 'string' ? JSON.parse(row.notification_chain) : row.notification_chain || []
  return {
    id: row.id,
    type: row.type,
    deviceId: row.device_id,
    severity: row.severity,
    status: row.status,
    description: row.description,
    location: row.location_lat != null ? { lat: row.location_lat, lng: row.location_lng } : undefined,
    notificationChain: chain,
    timestamp: row.timestamp,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function formatWorkOrder(row: Record<string, unknown>) {
  const notes = typeof row.notes === 'string' ? JSON.parse(row.notes) : row.notes || []
  return {
    id: row.id,
    alertId: row.alert_id,
    assignee: row.assignee,
    status: row.status,
    notes,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    updatedAt: row.updated_at,
  }
}

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { type, status, from, to } = req.query

  let sql = 'SELECT * FROM alerts WHERE 1=1'
  const params: unknown[] = []

  if (type) {
    sql += ' AND type = ?'
    params.push(type)
  }
  if (status) {
    sql += ' AND status = ?'
    params.push(status)
  }
  if (from) {
    sql += ' AND timestamp >= ?'
    params.push(from)
  }
  if (to) {
    sql += ' AND timestamp <= ?'
    params.push(to)
  }

  sql += ' ORDER BY timestamp DESC'
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[]
  res.json({ success: true, data: rows.map(formatAlert) })
})

router.get('/workorders', (req: Request, res: Response): void => {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM work_orders ORDER BY created_at DESC').all() as Record<string, unknown>[]
  res.json({ success: true, data: rows.map(formatWorkOrder) })
})

router.put('/:id/acknowledge', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined

  if (!row) {
    res.status(404).json({ success: false, error: 'Alert not found' })
    return
  }

  if (row.status !== 'pending') {
    res.status(400).json({ success: false, error: 'Alert can only be acknowledged from pending status' })
    return
  }

  db.prepare("UPDATE alerts SET status = 'acknowledged', updated_at = datetime('now') WHERE id = ?").run(req.params.id)
  const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id) as Record<string, unknown>
  res.json({ success: true, data: formatAlert(updated) })
})

router.put('/:id/resolve', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined

  if (!row) {
    res.status(404).json({ success: false, error: 'Alert not found' })
    return
  }

  if (row.status === 'resolved' || row.status === 'closed') {
    res.status(400).json({ success: false, error: 'Alert already resolved or closed' })
    return
  }

  db.prepare("UPDATE alerts SET status = 'resolved', updated_at = datetime('now') WHERE id = ?").run(req.params.id)
  const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id) as Record<string, unknown>
  res.json({ success: true, data: formatAlert(updated) })
})

router.post('/:id/workorder', (req: Request, res: Response): void => {
  const db = getDb()
  const alertRow = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined

  if (!alertRow) {
    res.status(404).json({ success: false, error: 'Alert not found' })
    return
  }

  const { assignee } = req.body
  if (!assignee) {
    res.status(400).json({ success: false, error: 'assignee is required' })
    return
  }

  const id = uuidv4()
  db.prepare(`
    INSERT INTO work_orders (id, alert_id, assignee, status, notes)
    VALUES (?, ?, ?, 'open', '[]')
  `).run(id, req.params.id, assignee)

  const wo = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id) as Record<string, unknown>
  res.status(201).json({ success: true, data: formatWorkOrder(wo) })
})

router.put('/workorders/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined

  if (!row) {
    res.status(404).json({ success: false, error: 'Work order not found' })
    return
  }

  const { status, note } = req.body
  const updates: string[] = []
  const params: unknown[] = []

  if (status) {
    if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status value' })
      return
    }
    updates.push('status = ?')
    params.push(status)

    if (status === 'resolved' || status === 'closed') {
      updates.push("resolved_at = datetime('now')")
    }
  }

  if (note) {
    const currentNotes = typeof row.notes === 'string' ? JSON.parse(row.notes) : []
    const newNote = {
      author: note.author || 'System',
      content: note.content || '',
      timestamp: new Date().toISOString().replace('T', ' ').replace('Z', ''),
    }
    currentNotes.push(newNote)
    updates.push('notes = ?')
    params.push(JSON.stringify(currentNotes))
  }

  if (updates.length === 0) {
    res.status(400).json({ success: false, error: 'No fields to update' })
    return
  }

  updates.push("updated_at = datetime('now')")
  params.push(req.params.id)
  db.prepare(`UPDATE work_orders SET ${updates.join(', ')} WHERE id = ?`).run(...params)

  const updated = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.id) as Record<string, unknown>
  res.json({ success: true, data: formatWorkOrder(updated) })
})

export default router
