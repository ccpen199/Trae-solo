import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { v4 as uuidv4 } from 'uuid'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 20
  const status = req.query.status as string
  const needVat = req.query.needVat
  const origin = req.query.origin as string
  const destination = req.query.destination as string

  const offset = (page - 1) * pageSize
  const conditions: string[] = ['1=1']
  const params: any[] = []

  if (status) {
    conditions.push('f.status = ?')
    params.push(status)
  }
  if (needVat !== undefined && needVat !== '') {
    conditions.push('f.need_vat = ?')
    params.push(needVat === 'true' || needVat === '1' ? 1 : 0)
  }
  if (origin) {
    conditions.push('f.origin LIKE ?')
    params.push(`%${origin}%`)
  }
  if (destination) {
    conditions.push('f.destination LIKE ?')
    params.push(`%${destination}%`)
  }

  const whereSql = conditions.join(' AND ')

  const total = db.prepare(`SELECT COUNT(*) as count FROM freights f WHERE ${whereSql}`).get(...params) as { count: number }

  const list = db.prepare(`
    SELECT f.*, u.name as shipper_name,
      ie.company_name as invoice_company_name
    FROM freights f
    LEFT JOIN users u ON f.shipper_id = u.id
    LEFT JOIN invoice_entities ie ON f.invoice_entity_id = ie.id
    WHERE ${whereSql}
    ORDER BY f.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset)

  res.json({ success: true, list, total: total.count })
})

router.get('/:id', authMiddleware, (req: Request, res: Response): void => {
  const freight = db.prepare(`
    SELECT f.*, u.name as shipper_name, u.phone as shipper_phone,
      ie.company_name as invoice_company_name, ie.tax_no as invoice_tax_no
    FROM freights f
    LEFT JOIN users u ON f.shipper_id = u.id
    LEFT JOIN invoice_entities ie ON f.invoice_entity_id = ie.id
    WHERE f.id = ?
  `).get(req.params.id)

  if (!freight) {
    res.status(404).json({ success: false, error: '货源不存在' })
    return
  }
  res.json({ success: true, data: freight })
})

router.post('/', authMiddleware, roleMiddleware('shipper'), (req: Request, res: Response): void => {
  const { origin, destination, goods_type, weight, freight_fee, need_vat, invoice_entity_id, description } = req.body
  const shipperId = req.user!.userId

  if (!origin || !destination || !goods_type || !weight || !freight_fee) {
    res.status(400).json({ success: false, error: '必填参数不完整' })
    return
  }
  if (need_vat && !invoice_entity_id) {
    res.status(400).json({ success: false, error: '需专票时必须指定开票主体' })
    return
  }

  const id = `f_${uuidv4().substring(0, 8)}`
  db.prepare(`
    INSERT INTO freights (id, shipper_id, origin, destination, goods_type, weight, freight_fee, need_vat, invoice_entity_id, description, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
  `).run(id, shipperId, origin, destination, goods_type, weight, freight_fee, need_vat ? 1 : 0, invoice_entity_id || null, description || '')

  const freight = db.prepare('SELECT * FROM freights WHERE id = ?').get(id)
  res.json({ success: true, data: freight })
})

router.post('/:id/accept', authMiddleware, roleMiddleware('driver'), (req: Request, res: Response): void => {
  const freightId = req.params.id
  const driverId = req.user!.userId

  const freight = db.prepare('SELECT * FROM freights WHERE id = ?').get(freightId) as any
  if (!freight) {
    res.status(404).json({ success: false, error: '货源不存在' })
    return
  }
  if (freight.status !== 'open') {
    res.status(400).json({ success: false, error: '该货源已被接单或已取消' })
    return
  }

  const driverProfile = db.prepare('SELECT certification_status FROM driver_profiles WHERE user_id = ?').get(driverId) as any
  if (!driverProfile || driverProfile.certification_status !== 'passed') {
    res.status(400).json({ success: false, error: '您尚未完成实名认证，无法接单' })
    return
  }

  const orderId = `o_${uuidv4().substring(0, 8)}`
  const waybillNo = `YD${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, freight_id, driver_id, shipper_id, status, waybill_no, total_fee)
    VALUES (?, ?, ?, ?, 'pending', ?, ?)
  `)

  const updateFreight = db.prepare("UPDATE freights SET status = 'accepted' WHERE id = ?")

  const tx = db.transaction(() => {
    insertOrder.run(orderId, freightId, driverId, freight.shipper_id, waybillNo, freight.freight_fee)
    updateFreight.run(freightId)
  })
  tx()

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
  res.json({ success: true, data: order })
})

export default router
