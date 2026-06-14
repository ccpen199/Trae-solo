import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db/init.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { user_id, category, status, page = '1', pageSize = '10' } = req.query

    let sql = `SELECT o.*, a.address, a.detail as address_detail FROM orders o LEFT JOIN addresses a ON o.address_id = a.id WHERE 1=1`
    const params: unknown[] = []

    if (user_id) {
      sql += ` AND o.user_id = ?`
      params.push(user_id)
    }
    if (category) {
      sql += ` AND o.category = ?`
      params.push(category)
    }
    if (status) {
      sql += ` AND o.status = ?`
      params.push(status)
    }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM orders o WHERE 1=1${sql.split('WHERE 1=1')[1]?.split('ORDER')[0] || ''}`).get(...params) as { total: number }
    const total = countRow.total

    const offset = (Number(page) - 1) * Number(pageSize)
    sql += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`
    params.push(Number(pageSize), offset)

    const orders = db.prepare(sql).all(...params)

    res.json({
      success: true,
      data: {
        list: orders,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取订单列表失败' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { id } = req.params

    const order = db.prepare(`SELECT o.*, a.address, a.detail as address_detail, a.name as receiver_name, a.phone as receiver_phone FROM orders o LEFT JOIN addresses a ON o.address_id = a.id WHERE o.id = ?`).get(id) as Record<string, unknown> | undefined
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    const items = db.prepare(`SELECT * FROM order_items WHERE order_id = ?`).all(id)

    const timeline: { status: string; time: string; label: string }[] = []
    const statusLabels: Record<string, string> = {
      pending: '已提交',
      dispatched: '已派单',
      picked_up: '已取件',
      inspecting: '质检中',
      priced: '已定价',
      confirmed: '已确认',
      settled: '已结算',
      donated: '已捐赠',
      rejected: '已驳回',
    }
    const statusFlow = ['pending', 'dispatched', 'picked_up', 'inspecting', 'priced', 'confirmed', 'settled']
    const orderStatus = (order as { status: string; created_at: string; updated_at: string }).status
    const currentIdx = statusFlow.indexOf(orderStatus)

    for (let i = 0; i <= Math.min(currentIdx, statusFlow.length - 1); i++) {
      timeline.push({
        status: statusFlow[i],
        label: statusLabels[statusFlow[i]],
        time: i === 0 ? (order as { created_at: string }).created_at : (order as { updated_at: string }).updated_at,
      })
    }

    res.json({
      success: true,
      data: { ...order, items, timeline },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取订单详情失败' })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { user_id, category, address_id, time_slot, items, estimate_price } = req.body

    if (!user_id || !category) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const id = uuidv4()
    db.prepare(`INSERT INTO orders (id, user_id, category, status, estimate_price, address_id, time_slot) VALUES (?, ?, ?, 'pending', ?, ?, ?)`).run(
      id, user_id, category, estimate_price || null, address_id || null, time_slot || null
    )

    if (items && Array.isArray(items)) {
      for (const item of items) {
        db.prepare(`INSERT INTO order_items (id, order_id, brand, model, condition, weight) VALUES (?, ?, ?, ?, ?, ?)`).run(
          uuidv4(), id, item.brand || null, item.model || null, item.condition || '八成新', item.weight || null
        )
      }
    }

    const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id) as Record<string, unknown>
    const orderItems = db.prepare(`SELECT * FROM order_items WHERE order_id = ?`).all(id)

    res.status(201).json({
      success: true,
      data: { ...order, items: orderItems },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建订单失败' })
  }
})

export default router
