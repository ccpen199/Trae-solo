import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 10))
    const offset = (page - 1) * pageSize

    let where = 'WHERE o.user_id = ?'
    const params: any[] = [user.userId]

    if (req.query.status) {
      where += ' AND o.status = ?'
      params.push(req.query.status)
    }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM orders o ${where}`).get(...params) as { total: number }
    const rows = db.prepare(
      `SELECT o.*, p.name as product_name, p.cover_image as product_cover, p.price as product_price, m.name as merchant_name FROM orders o LEFT JOIN products p ON o.product_id = p.id LEFT JOIN merchants m ON o.merchant_id = m.id ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSize, offset) as any[]

    res.json({
      success: true,
      data: {
        list: rows,
        total: countRow.total,
        page,
        pageSize
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user
    const order = db.prepare(
      `SELECT o.*, p.name as product_name, p.cover_image as product_cover, p.description as product_description, m.name as merchant_name FROM orders o LEFT JOIN products p ON o.product_id = p.id LEFT JOIN merchants m ON o.merchant_id = m.id WHERE o.id = ?`
    ).get(req.params.id) as any

    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    if (user.role !== 'admin' && order.user_id !== user.userId) {
      res.status(403).json({ success: false, error: '无权限访问' })
      return
    }

    res.json({ success: true, data: order })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user
    const { product_id, quantity, consignee, phone, address } = req.body

    const product = db.prepare('SELECT * FROM products WHERE id = ? AND status = \'active\'').get(product_id) as any

    if (!product) {
      res.status(404).json({ success: false, error: '商品不存在' })
      return
    }

    if (product.stock < quantity) {
      res.status(400).json({ success: false, error: '库存不足' })
      return
    }

    const total_price = product.price * quantity
    const order_no = 'BXGZ' + Date.now() + Math.floor(1000 + Math.random() * 9000)

    const result = db.prepare(
      `INSERT INTO orders (order_no, user_id, product_id, merchant_id, quantity, total_price, traceability_code, consignee, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(order_no, user.userId, product_id, product.merchant_id, quantity, total_price, product.traceability_code, consignee, phone, address)

    db.prepare('UPDATE products SET stock = stock - ?, sales = sales + ? WHERE id = ?').run(quantity, quantity, product_id)

    res.json({ success: true, data: { id: result.lastInsertRowid, order_no } })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.put('/:id/pay', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any

    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    if (user.role !== 'admin' && order.user_id !== user.userId) {
      res.status(403).json({ success: false, error: '无权限操作' })
      return
    }

    if (order.status !== 'pending') {
      res.status(400).json({ success: false, error: '订单状态不可支付' })
      return
    }

    db.prepare("UPDATE orders SET status = 'paid', paid_at = datetime('now') WHERE id = ?").run(req.params.id)

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.put('/:id/cancel', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any

    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    if (user.role !== 'admin' && order.user_id !== user.userId) {
      res.status(403).json({ success: false, error: '无权限操作' })
      return
    }

    if (order.status !== 'pending' && order.status !== 'paid') {
      res.status(400).json({ success: false, error: '订单状态不可取消' })
      return
    }

    db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(order.quantity, order.product_id)
    db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(req.params.id)

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

router.put('/:id/confirm', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any

    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    if (user.role !== 'admin' && order.user_id !== user.userId) {
      res.status(403).json({ success: false, error: '无权限操作' })
      return
    }

    if (order.status !== 'shipped') {
      res.status(400).json({ success: false, error: '订单状态不可确认收货' })
      return
    }

    db.prepare("UPDATE orders SET status = 'completed', completed_at = datetime('now') WHERE id = ?").run(req.params.id)

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

export default router
