import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/products', (req: Request, res: Response): void => {
  const { category } = req.query
  let sql = 'SELECT * FROM products WHERE 1=1'
  const params: any[] = []

  if (category) {
    sql += ' AND category = ?'
    params.push(category)
  }
  sql += ' ORDER BY created_at DESC'

  const products = db.prepare(sql).all(...params)
  res.json({ success: true, data: products })
})

router.get('/products/:id', (req: Request, res: Response): void => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(req.params.id))
  if (!product) {
    res.status(404).json({ success: false, error: '商品不存在' })
    return
  }
  res.json({ success: true, data: product })
})

router.post('/cart', (req: Request, res: Response): void => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const { product_id, quantity } = req.body
  if (!product_id) {
    res.status(400).json({ success: false, error: '商品ID为必填项' })
    return
  }

  const existing = db.prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?').get(Number(userId), product_id) as any
  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(quantity || 1, existing.id)
    const updated = db.prepare('SELECT * FROM cart_items WHERE id = ?').get(existing.id)
    res.json({ success: true, data: updated })
    return
  }

  const result = db.prepare(
    'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)'
  ).run(Number(userId), product_id, quantity || 1)

  const item = db.prepare('SELECT * FROM cart_items WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: item })
})

router.get('/cart', (req: Request, res: Response): void => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const items = db.prepare(
    `SELECT c.id, c.quantity, c.product_id, p.name, p.price, p.image_url, p.stock
    FROM cart_items c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?`
  ).all(Number(userId))

  res.json({ success: true, data: items })
})

router.delete('/cart/:id', (req: Request, res: Response): void => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const item = db.prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?').get(Number(req.params.id), Number(userId))
  if (!item) {
    res.status(404).json({ success: false, error: '购物车项不存在' })
    return
  }

  db.prepare('DELETE FROM cart_items WHERE id = ?').run(Number(req.params.id))
  res.json({ success: true, data: { deleted: true } })
})

router.post('/order', (req: Request, res: Response): void => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const cartItems = db.prepare(
    `SELECT c.*, p.name, p.price, p.stock FROM cart_items c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?`
  ).all(Number(userId)) as any[]

  if (cartItems.length === 0) {
    res.status(400).json({ success: false, error: '购物车为空' })
    return
  }

  const outOfStock = cartItems.find(item => item.stock < item.quantity)
  if (outOfStock) {
    res.status(400).json({ success: false, error: `商品"${outOfStock.name}"库存不足` })
    return
  }

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  for (const item of cartItems) {
    db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.product_id)
  }

  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(Number(userId))

  res.json({ success: true, data: { order_id: Date.now(), total, items: cartItems.length } })
})

export default router
