import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/apartments', (req: Request, res: Response): void => {
  const db = getDb()
  const { status, page = '1', pageSize = '20' } = req.query
  const p = Number(page)
  const ps = Number(pageSize)
  const offset = (p - 1) * ps

  let where = 'WHERE 1=1'
  const params: any[] = []
  if (status) { where += ' AND xa.status = ?'; params.push(status) }

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM xiangyu_apartments xa ${where}`).get(...params) as any).cnt
  const rows = db.prepare(
    `SELECT xa.*, p.title as property_title, p.area, p.rooms, p.community_id,
      c.name as community_name, c.district, u.name as tenant_name, u.phone as tenant_phone
    FROM xiangyu_apartments xa
    LEFT JOIN properties p ON xa.property_id = p.id
    LEFT JOIN communities c ON p.community_id = c.id
    LEFT JOIN users u ON xa.tenant_id = u.id
    ${where} ORDER BY xa.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, ps, offset)

  res.json({ success: true, data: { list: rows, total, page: p, pageSize: ps } })
})

router.get('/apartments/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const apt = db.prepare(
    `SELECT xa.*, p.title as property_title, p.area, p.rooms,
      c.name as community_name, c.district, u.name as tenant_name, u.phone as tenant_phone
    FROM xiangyu_apartments xa
    LEFT JOIN properties p ON xa.property_id = p.id
    LEFT JOIN communities c ON p.community_id = c.id
    LEFT JOIN users u ON xa.tenant_id = u.id
    WHERE xa.id = ?`
  ).get(req.params.id) as Record<string, unknown> | undefined
  if (!apt) {
    res.status(404).json({ success: false, error: '公寓不存在' })
    return
  }
  const cleanings = db.prepare('SELECT * FROM cleaning_appointments WHERE apartment_id = ? ORDER BY appointment_date DESC LIMIT 10').all(req.params.id)
  const repairs = db.prepare('SELECT * FROM repair_orders WHERE apartment_id = ? ORDER BY created_at DESC LIMIT 10').all(req.params.id)
  res.json({ success: true, data: { ...apt, cleanings, repairs } })
})

router.put('/apartments/:id/lock', (req: Request, res: Response): void => {
  const db = getDb()
  const { lock_status, lock_battery } = req.body
  const updates: string[] = []
  const params: any[] = []
  if (lock_status) { updates.push('lock_status = ?'); params.push(lock_status) }
  if (lock_battery !== undefined) { updates.push('lock_battery = ?'); params.push(lock_battery) }
  if (updates.length === 0) { res.json({ success: true }); return }
  updates.push("updated_at = datetime('now','localtime')")
  params.push(req.params.id)
  db.prepare(`UPDATE xiangyu_apartments SET ${updates.join(', ')} WHERE id = ?`).run(...params)
  res.json({ success: true })
})

router.post('/cleanings', (req: Request, res: Response): void => {
  const db = getDb()
  const { apartment_id, appointment_date, time_slot, notes } = req.body
  if (!apartment_id || !appointment_date) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }
  const r = db.prepare(
    'INSERT INTO cleaning_appointments (apartment_id, appointment_date, time_slot, notes) VALUES (?, ?, ?, ?)'
  ).run(apartment_id, appointment_date, time_slot || '09:00-12:00', notes || '')
  res.json({ success: true, data: { id: r.lastInsertRowid } })
})

router.put('/cleanings/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const { status } = req.body
  if (status) {
    db.prepare('UPDATE cleaning_appointments SET status = ? WHERE id = ?').run(status, req.params.id)
  }
  res.json({ success: true })
})

router.post('/repairs', (req: Request, res: Response): void => {
  const db = getDb()
  const { apartment_id, title, description, category, urgency } = req.body
  if (!apartment_id || !title) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }
  const r = db.prepare(
    'INSERT INTO repair_orders (apartment_id, title, description, category, urgency) VALUES (?, ?, ?, ?, ?)'
  ).run(apartment_id, title, description || '', category || 'other', urgency || 'normal')
  res.json({ success: true, data: { id: r.lastInsertRowid } })
})

router.put('/repairs/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const { status, assigned_to } = req.body
  const updates: string[] = []
  const params: any[] = []
  if (status) { updates.push('status = ?'); params.push(status) }
  if (assigned_to !== undefined) { updates.push('assigned_to = ?'); params.push(assigned_to) }
  if (updates.length === 0) { res.json({ success: true }); return }
  updates.push("updated_at = datetime('now','localtime')")
  params.push(req.params.id)
  db.prepare(`UPDATE repair_orders SET ${updates.join(', ')} WHERE id = ?`).run(...params)
  res.json({ success: true })
})

router.get('/repairs', (req: Request, res: Response): void => {
  const db = getDb()
  const { status, apartment_id, page = '1', pageSize = '20' } = req.query
  const p = Number(page)
  const ps = Number(pageSize)
  const offset = (p - 1) * ps

  let where = 'WHERE 1=1'
  const params: any[] = []
  if (status) { where += ' AND r.status = ?'; params.push(status) }
  if (apartment_id) { where += ' AND r.apartment_id = ?'; params.push(apartment_id) }

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM repair_orders r ${where}`).get(...params) as any).cnt
  const rows = db.prepare(
    `SELECT r.*, xa.contract_no, xa.property_id, p.title as property_title,
      a.name as assigned_name
    FROM repair_orders r
    LEFT JOIN xiangyu_apartments xa ON r.apartment_id = xa.id
    LEFT JOIN properties p ON xa.property_id = p.id
    LEFT JOIN agents a ON r.assigned_to = a.id
    ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, ps, offset)

  res.json({ success: true, data: { list: rows, total, page: p, pageSize: ps } })
})

export default router
