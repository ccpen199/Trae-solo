import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const page = Number(req.query.page) || 1
  const pageSize = Number(req.query.page_size) || 20
  const status = req.query.status as string
  const zoneId = req.query.zone_id as string
  const verifyStatus = req.query.verify_status as string
  const search = req.query.search as string

  const conditions: string[] = []
  const params: any[] = []

  if (status) {
    conditions.push('r.status = ?')
    params.push(status)
  }
  if (zoneId) {
    conditions.push('r.zone_id = ?')
    params.push(zoneId)
  }
  if (verifyStatus) {
    conditions.push('r.verify_status = ?')
    params.push(verifyStatus)
  }
  if (search) {
    conditions.push('(r.name LIKE ? OR r.phone LIKE ?)')
    params.push(`%${search}%`, `%${search}%`)
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
  const total = (db.prepare(`SELECT COUNT(*) as count FROM riders r ${whereClause}`).get(...params) as any).count
  const offset = (page - 1) * pageSize

  const riders = db
    .prepare(
      `SELECT r.*, z.name as zone_name FROM riders r LEFT JOIN dispatch_zones z ON r.zone_id = z.id ${whereClause} ORDER BY r.id DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, pageSize, offset)

  res.json({ success: true, data: { list: riders, total, page, page_size: pageSize } })
})

router.get('/:id', (req: Request, res: Response): void => {
  const rider = db
    .prepare(
      'SELECT r.*, z.name as zone_name FROM riders r LEFT JOIN dispatch_zones z ON r.zone_id = z.id WHERE r.id = ?',
    )
    .get(req.params.id)

  if (!rider) {
    res.status(404).json({ success: false, error: '骑手不存在' })
    return
  }
  res.json({ success: true, data: rider })
})

router.post('/', (req: Request, res: Response): void => {
  const { name, phone, id_card, health_code_status, vehicle_type, plate_number, license_photos, zone_id } = req.body

  if (!name || !phone || !id_card) {
    res.status(400).json({ success: false, error: '姓名、手机号、身份证号为必填项' })
    return
  }

  const result = db
    .prepare(
      `INSERT INTO riders (name, phone, id_card, health_code_status, vehicle_type, plate_number, license_photos, zone_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(name, phone, id_card, health_code_status || 'green', vehicle_type || 'electric_bike', plate_number || '', license_photos || '', zone_id || null)

  const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: rider })
})

router.put('/:id', (req: Request, res: Response): void => {
  const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(req.params.id)
  if (!rider) {
    res.status(404).json({ success: false, error: '骑手不存在' })
    return
  }

  const fields: string[] = []
  const params: any[] = []
  const allowedFields = ['name', 'phone', 'id_card', 'health_code_status', 'vehicle_type', 'plate_number', 'license_photos', 'zone_id', 'service_score', 'credit_score', 'status']

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

  fields.push("updated_at = datetime('now', 'localtime')")
  params.push(req.params.id)

  db.prepare(`UPDATE riders SET ${fields.join(', ')} WHERE id = ?`).run(...params)
  const updated = db.prepare('SELECT * FROM riders WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

router.put('/:id/verify', (req: Request, res: Response): void => {
  const { verify_status } = req.body
  if (!['approved', 'rejected'].includes(verify_status)) {
    res.status(400).json({ success: false, error: 'verify_status 必须为 approved 或 rejected' })
    return
  }

  const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(req.params.id)
  if (!rider) {
    res.status(404).json({ success: false, error: '骑手不存在' })
    return
  }

  db.prepare("UPDATE riders SET verify_status = ?, updated_at = datetime('now', 'localtime') WHERE id = ?").run(verify_status, req.params.id)
  db.prepare("INSERT INTO verify_logs (target_type, target_id, action, operator, reason) VALUES (?, ?, ?, ?, ?)").run('rider', req.params.id, `verify_${verify_status}`, 'admin', req.body.reason || '')
  const updated = db.prepare('SELECT * FROM riders WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

router.get('/:id/credit', (req: Request, res: Response): void => {
  const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(req.params.id)
  if (!rider) {
    res.status(404).json({ success: false, error: '骑手不存在' })
    return
  }

  const records = db.prepare('SELECT * FROM credit_records WHERE rider_id = ? ORDER BY created_at DESC').all(req.params.id)
  res.json({ success: true, data: records })
})

router.post('/:id/credit/appeal', (req: Request, res: Response): void => {
  const { credit_record_id } = req.body
  if (!credit_record_id) {
    res.status(400).json({ success: false, error: 'credit_record_id 为必填项' })
    return
  }

  const record = db.prepare('SELECT * FROM credit_records WHERE id = ? AND rider_id = ?').get(credit_record_id, req.params.id)
  if (!record) {
    res.status(404).json({ success: false, error: '信用记录不存在' })
    return
  }

  db.prepare("UPDATE credit_records SET appeal_status = 'appealed' WHERE id = ?").run(credit_record_id)
  const updated = db.prepare('SELECT * FROM credit_records WHERE id = ?').get(credit_record_id)
  res.json({ success: true, data: updated })
})

router.put('/:id/credit/appeal/:recordId', (req: Request, res: Response): void => {
  const { appeal_status, reason } = req.body
  if (!['approved', 'rejected'].includes(appeal_status)) {
    res.status(400).json({ success: false, error: 'appeal_status 必须为 approved 或 rejected' })
    return
  }

  const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(req.params.id)
  if (!rider) {
    res.status(404).json({ success: false, error: '骑手不存在' })
    return
  }

  const record = db.prepare('SELECT * FROM credit_records WHERE id = ? AND rider_id = ?').get(req.params.recordId, req.params.id)
  if (!record) {
    res.status(404).json({ success: false, error: '信用记录不存在' })
    return
  }

  if (appeal_status === 'approved') {
    const restoreScore = Math.abs((record as any).score_change)
    db.prepare("UPDATE riders SET credit_score = credit_score + ?, updated_at = datetime('now', 'localtime') WHERE id = ?").run(restoreScore, req.params.id)
  }
  db.prepare("UPDATE credit_records SET appeal_status = ? WHERE id = ?").run(appeal_status, req.params.recordId)
  db.prepare("INSERT INTO verify_logs (target_type, target_id, action, operator, reason) VALUES (?, ?, ?, ?, ?)").run('credit_record', req.params.recordId, `appeal_${appeal_status}`, 'admin', reason || '')

  const updatedRider = db.prepare('SELECT * FROM riders WHERE id = ?').get(req.params.id)
  const updatedRecord = db.prepare('SELECT * FROM credit_records WHERE id = ?').get(req.params.recordId)
  res.json({ success: true, data: { rider: updatedRider, record: updatedRecord } })
})

router.get('/:id/income', (req: Request, res: Response): void => {
  const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(req.params.id)
  if (!rider) {
    res.status(404).json({ success: false, error: '骑手不存在' })
    return
  }

  const records = db.prepare('SELECT * FROM incomes WHERE rider_id = ? ORDER BY created_at DESC').all(req.params.id)
  res.json({ success: true, data: records })
})

router.put('/:id/location', (req: Request, res: Response): void => {
  const { latitude, longitude } = req.body
  if (latitude === undefined || longitude === undefined) {
    res.status(400).json({ success: false, error: 'latitude 和 longitude 为必填项' })
    return
  }

  const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(req.params.id)
  if (!rider) {
    res.status(404).json({ success: false, error: '骑手不存在' })
    return
  }

  db.prepare("UPDATE riders SET latitude = ?, longitude = ?, updated_at = datetime('now', 'localtime') WHERE id = ?").run(latitude, longitude, req.params.id)
  res.json({ success: true, data: { id: Number(req.params.id), latitude, longitude } })
})

router.get('/:id/trajectory', (req: Request, res: Response): void => {
  const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(req.params.id)
  if (!rider) {
    res.status(404).json({ success: false, error: '骑手不存在' })
    return
  }

  const orderId = req.query.order_id as string
  let records: any[]
  if (orderId) {
    records = db.prepare('SELECT * FROM trajectories WHERE rider_id = ? AND order_id = ? ORDER BY timestamp DESC').all(req.params.id, orderId)
  } else {
    records = db.prepare('SELECT * FROM trajectories WHERE rider_id = ? ORDER BY timestamp DESC').all(req.params.id)
  }
  res.json({ success: true, data: records })
})

export default router
