import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const page = Number(req.query.page) || 1
  const pageSize = Number(req.query.page_size) || 20
  const verifyStatus = req.query.verify_status as string

  const conditions: string[] = []
  const params: any[] = []

  if (verifyStatus) {
    conditions.push('verify_status = ?')
    params.push(verifyStatus)
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
  const total = (db.prepare(`SELECT COUNT(*) as count FROM merchants ${whereClause}`).get(...params) as any).count
  const offset = (page - 1) * pageSize

  const merchants = db
    .prepare(`SELECT m.*, z.name as zone_name FROM merchants m LEFT JOIN dispatch_zones z ON m.zone_id = z.id ${whereClause} ORDER BY m.id DESC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset)

  res.json({ success: true, data: { list: merchants, total, page, page_size: pageSize } })
})

router.get('/:id', (req: Request, res: Response): void => {
  const merchant = db
    .prepare('SELECT m.*, z.name as zone_name FROM merchants m LEFT JOIN dispatch_zones z ON m.zone_id = z.id WHERE m.id = ?')
    .get(req.params.id)

  if (!merchant) {
    res.status(404).json({ success: false, error: '商户不存在' })
    return
  }
  res.json({ success: true, data: merchant })
})

router.post('/', (req: Request, res: Response): void => {
  const { name, contact_name, phone, address, zone_id } = req.body

  if (!name || !contact_name || !phone || !address) {
    res.status(400).json({ success: false, error: '商户名称、联系人、电话、地址为必填项' })
    return
  }

  const result = db
    .prepare('INSERT INTO merchants (name, contact_name, phone, address, zone_id) VALUES (?, ?, ?, ?, ?)')
    .run(name, contact_name, phone, address, zone_id || null)

  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: merchant })
})

router.put('/:id', (req: Request, res: Response): void => {
  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.id)
  if (!merchant) {
    res.status(404).json({ success: false, error: '商户不存在' })
    return
  }

  const fields: string[] = []
  const params: any[] = []
  const allowedFields = ['name', 'contact_name', 'phone', 'address', 'zone_id', 'fulfillment_score']

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

  db.prepare(`UPDATE merchants SET ${fields.join(', ')} WHERE id = ?`).run(...params)
  const updated = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

router.put('/:id/verify', (req: Request, res: Response): void => {
  const { verify_status } = req.body
  if (!['approved', 'rejected'].includes(verify_status)) {
    res.status(400).json({ success: false, error: 'verify_status 必须为 approved 或 rejected' })
    return
  }

  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.id)
  if (!merchant) {
    res.status(404).json({ success: false, error: '商户不存在' })
    return
  }

  db.prepare("UPDATE merchants SET verify_status = ?, updated_at = datetime('now', 'localtime') WHERE id = ?").run(verify_status, req.params.id)
  db.prepare("INSERT INTO verify_logs (target_type, target_id, action, operator, reason) VALUES (?, ?, ?, ?, ?)").run('merchant', req.params.id, `verify_${verify_status}`, 'admin', req.body.reason || '')
  const updated = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

export default router
