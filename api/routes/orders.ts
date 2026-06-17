import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 10))
  const user_id = req.query.user_id as string
  const merchant_id = req.query.merchant_id as string
  const status = req.query.status as string

  let where = 'WHERE 1=1'
  const params: unknown[] = []

  if (user_id) {
    where += ' AND o.user_id = ?'
    params.push(user_id)
  }
  if (merchant_id) {
    where += ' AND o.merchant_id = ?'
    params.push(merchant_id)
  }
  if (status) {
    where += ' AND o.status = ?'
    params.push(status)
  }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM orders o ${where}`).get(...params) as { count: number }).count
  const offset = (page - 1) * pageSize
  const items = db.prepare(`
    SELECT o.*, p.name as package_name, p.type as package_type, m.name as merchant_name
    FROM orders o
    LEFT JOIN packages p ON o.package_id = p.id
    LEFT JOIN merchants m ON o.merchant_id = m.id
    ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset)

  res.json({
    code: 200,
    message: 'ok',
    data: { items, total, page, pageSize },
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const order = db.prepare(`
    SELECT o.*, p.name as package_name, p.type as package_type, m.name as merchant_name
    FROM orders o
    LEFT JOIN packages p ON o.package_id = p.id
    LEFT JOIN merchants m ON o.merchant_id = m.id
    WHERE o.id = ?
  `).get(req.params.id)

  if (!order) {
    res.status(404).json({ code: 404, message: '订单不存在', data: null })
    return
  }

  res.json({ code: 200, message: 'ok', data: order })
})

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { user_id, package_id } = req.body

  if (!user_id || !package_id) {
    res.status(400).json({ code: 400, message: '缺少必要字段', data: null })
    return
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id)
  if (!user) {
    res.status(404).json({ code: 404, message: '用户不存在', data: null })
    return
  }

  const pkg = db.prepare('SELECT * FROM packages WHERE id = ? AND status = ?').get(package_id, 'active') as Record<string, unknown> | undefined
  if (!pkg) {
    res.status(404).json({ code: 404, message: '套餐不存在或已下架', data: null })
    return
  }

  const stock = pkg.stock as number
  const sold = pkg.sold as number
  if (stock - sold <= 0) {
    res.status(400).json({ code: 400, message: '库存不足', data: null })
    return
  }

  const now = new Date()
  const endTime = pkg.end_time as string
  const expiresAt = endTime || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
  const fmt = (d: Date) => d.toISOString().replace('T', ' ').slice(0, 19)

  const id = uuidv4()
  const orderNo = `SJ${Date.now()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  const verificationCode = String(Math.floor(100000 + Math.random() * 900000))
  const paidAt = fmt(now)

  db.prepare(`
    INSERT INTO orders (id, user_id, package_id, merchant_id, order_no, verification_code, status, amount, paid_at, used_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, 'paid', ?, ?, '', ?)
  `).run(id, user_id, package_id, pkg.merchant_id, orderNo, verificationCode, pkg.price, paidAt, expiresAt)

  db.prepare('UPDATE packages SET sold = sold + 1 WHERE id = ?').run(package_id)

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
  res.status(201).json({ code: 201, message: 'ok', data: order })
})

router.post('/verify', (req: Request, res: Response): void => {
  const db = getDb()
  const { verification_code, merchant_id } = req.body

  if (!verification_code || !merchant_id) {
    res.status(400).json({ code: 400, message: '缺少核销码或商户ID', data: null })
    return
  }

  const order = db.prepare('SELECT * FROM orders WHERE verification_code = ? AND merchant_id = ?').get(verification_code, merchant_id) as Record<string, unknown> | undefined
  if (!order) {
    res.status(404).json({ code: 404, message: '核销码无效', data: null })
    return
  }

  if (order.status !== 'paid') {
    res.status(400).json({ code: 400, message: `订单状态为${order.status}，无法核销`, data: null })
    return
  }

  const now = new Date()
  const expiresAt = new Date(order.expires_at as string)
  if (now > expiresAt) {
    db.prepare("UPDATE orders SET status = 'expired' WHERE id = ?").run(order.id)
    res.status(400).json({ code: 400, message: '订单已过期', data: null })
    return
  }

  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(order.package_id) as Record<string, unknown> | undefined
  if (pkg) {
    const stock = pkg.stock as number
    const sold = pkg.sold as number
    if (stock - sold < 0) {
      res.status(400).json({ code: 400, message: '库存不足', data: null })
      return
    }
  }

  const fmt = (d: Date) => d.toISOString().replace('T', ' ').slice(0, 19)
  const verifiedAt = fmt(now)

  db.prepare("UPDATE orders SET status = 'used', used_at = ? WHERE id = ?").run(verifiedAt, order.id)
  db.prepare('INSERT INTO verifications (id, order_id, merchant_id, verified_by, verified_at) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), order.id, merchant_id, merchant_id, verifiedAt)

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id)
  res.json({ code: 200, message: '核销成功', data: updated })
})

router.get('/code/:code', (req: Request, res: Response): void => {
  const db = getDb()
  const order = db.prepare(`
    SELECT o.*, p.name as package_name, p.type as package_type, m.name as merchant_name
    FROM orders o
    LEFT JOIN packages p ON o.package_id = p.id
    LEFT JOIN merchants m ON o.merchant_id = m.id
    WHERE o.verification_code = ?
  `).get(req.params.code)

  if (!order) {
    res.status(404).json({ code: 404, message: '核销码无效', data: null })
    return
  }

  const dynamicCode = String(Math.floor(100000 + Math.random() * 900000))
  res.json({ code: 200, message: 'ok', data: Object.assign({}, order as Record<string, unknown>, { dynamic_code: dynamicCode }) })
})

export default router
