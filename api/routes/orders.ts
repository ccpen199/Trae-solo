import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { user_id, status } = req.query
  const db = getDb()

  let sql = `
    SELECT o.*, p.name as product_name, p.images as product_images, m.name as merchant_name
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    LEFT JOIN merchants m ON p.merchant_id = m.id
    WHERE 1=1
  `
  const params: any[] = []

  if (user_id) {
    sql += " AND o.user_id = ?"
    params.push(Number(user_id))
  }

  if (status) {
    sql += " AND o.status = ?"
    params.push(status)
  }

  sql += " ORDER BY o.created_at DESC"
  const rows = db.prepare(sql).all(...params)
  res.json({ success: true, data: rows })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const order = db.prepare(`
    SELECT o.*, p.name as product_name, p.images as product_images, p.description as product_description,
           m.name as merchant_name, m.id as merchant_id
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    LEFT JOIN merchants m ON p.merchant_id = m.id
    WHERE o.id = ?
  `).get(Number(req.params.id)) as any

  if (!order) {
    res.status(404).json({ success: false, error: '订单不存在' })
    return
  }

  const timeline = db.prepare(`
    SELECT * FROM order_timeline WHERE order_id = ? ORDER BY created_at ASC
  `).all(Number(req.params.id))

  res.json({
    success: true,
    data: {
      ...order,
      timeline,
    },
  })
})

router.post('/', (req: Request, res: Response): void => {
  const { user_id, product_id, amount, appointment_time } = req.body
  if (!user_id || !product_id || !amount) {
    res.status(400).json({ success: false, error: 'user_id、product_id和amount为必填项' })
    return
  }

  const db = getDb()
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(product_id))
  if (!product) {
    res.status(404).json({ success: false, error: '商品不存在' })
    return
  }

  const tx = db.transaction(() => {
    const orderResult = db.prepare(
      'INSERT INTO orders (user_id, product_id, status, amount, appointment_time) VALUES (?, ?, ?, ?, ?)'
    ).run(Number(user_id), Number(product_id), 'created', Number(amount), appointment_time || null)

    const orderId = orderResult.lastInsertRowid
    db.prepare(
      'INSERT INTO order_timeline (order_id, status, description) VALUES (?, ?, ?)'
    ).run(orderId, 'created', '订单已创建')

    return orderId
  })

  const orderId = tx()
  const order = db.prepare(`
    SELECT o.*, p.name as product_name, m.name as merchant_name
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    LEFT JOIN merchants m ON p.merchant_id = m.id
    WHERE o.id = ?
  `).get(orderId)

  res.json({ success: true, data: order })
})

router.patch('/:id/status', (req: Request, res: Response): void => {
  const { status, description } = req.body
  if (!status) {
    res.status(400).json({ success: false, error: 'status为必填项' })
    return
  }

  const db = getDb()
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id))
  if (!order) {
    res.status(404).json({ success: false, error: '订单不存在' })
    return
  }

  const tx = db.transaction(() => {
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, Number(req.params.id))
    db.prepare(
      'INSERT INTO order_timeline (order_id, status, description) VALUES (?, ?, ?)'
    ).run(Number(req.params.id), status, description || `订单状态已更新为${status}`)
  })

  tx()

  const updatedOrder = db.prepare(`
    SELECT o.*, p.name as product_name, m.name as merchant_name
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    LEFT JOIN merchants m ON p.merchant_id = m.id
    WHERE o.id = ?
  `).get(Number(req.params.id))

  res.json({ success: true, data: updatedOrder })
})

export default router
