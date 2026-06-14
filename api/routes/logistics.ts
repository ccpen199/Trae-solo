import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db/init.js'

const router = Router()

router.get('/orders', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { status, provider, page = '1', pageSize = '10' } = req.query

    let sql = `SELECT l.*, o.category, o.user_id FROM logistics_orders l JOIN orders o ON l.order_id = o.id WHERE 1=1`
    const params: unknown[] = []

    if (status) {
      sql += ` AND l.status = ?`
      params.push(status)
    }
    if (provider) {
      sql += ` AND l.provider = ?`
      params.push(provider)
    }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM logistics_orders l WHERE 1=1${sql.split('WHERE 1=1')[1]?.split('ORDER')[0] || ''}`).get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    sql += ` ORDER BY l.created_at DESC LIMIT ? OFFSET ?`
    params.push(Number(pageSize), offset)

    const logistics = db.prepare(sql).all(...params)

    res.json({
      success: true,
      data: {
        list: logistics,
        total: countRow.total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取物流列表失败' })
  }
})

router.post('/dispatch', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { order_id, provider, pickup_address, pickup_time_slot } = req.body

    if (!order_id || !provider) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(order_id) as Record<string, unknown> | undefined
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    if (order.status !== 'pending' && order.status !== 'dispatched') {
      res.status(400).json({ success: false, error: '订单状态不允许派单' })
      return
    }

    const id = uuidv4()
    const courier = ['快递员小张', '快递员小王', '快递员小李', '快递员小赵'][Math.floor(Math.random() * 4)]
    const providerPrefix = provider === 'sf' ? 'SF' : 'JD'
    const trackingNo = `${providerPrefix}${Date.now()}${Math.floor(Math.random() * 1000)}`

    db.prepare(`INSERT INTO logistics_orders (id, order_id, courier, provider, status, tracking_no, pickup_address, pickup_time_slot) VALUES (?, ?, ?, ?, 'dispatched', ?, ?, ?)`).run(
      id, order_id, courier, provider, trackingNo, pickup_address || '', pickup_time_slot || ''
    )

    db.prepare(`UPDATE orders SET status = 'dispatched', updated_at = datetime('now') WHERE id = ?`).run(order_id)

    const logistics = db.prepare(`SELECT * FROM logistics_orders WHERE id = ?`).get(id)

    res.status(201).json({
      success: true,
      data: logistics,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '派单失败' })
  }
})

export default router
