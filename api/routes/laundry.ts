import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import { getDb } from '../database.js'
import { authMiddleware, adminOnly } from '../middleware/auth.js'

const router = Router()

const LAUNDRY_PRICES: Record<string, Record<string, number>> = {
  shirt: { dry_clean: 35, wet_wash: 20, iron: 15, stain_removal: 40, leather_care: 0 },
  pants: { dry_clean: 35, wet_wash: 20, iron: 15, stain_removal: 40, leather_care: 0 },
  coat: { dry_clean: 60, wet_wash: 35, iron: 25, stain_removal: 65, leather_care: 80 },
  suit: { dry_clean: 100, wet_wash: 0, iron: 40, stain_removal: 100, leather_care: 0 },
  shoes: { dry_clean: 0, wet_wash: 0, iron: 0, stain_removal: 30, leather_care: 50 },
  other: { dry_clean: 30, wet_wash: 20, iron: 15, stain_removal: 35, leather_care: 0 },
}

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending_pickup: ['picked_up', 'cancelled'],
  picked_up: ['quality_check'],
  quality_check: ['processing'],
  processing: ['ready_delivery'],
  ready_delivery: ['delivered'],
  delivered: [],
}

router.post('/order', authMiddleware, (req: Request, res: Response): void => {
  try {
    const {
      compartment_id, clothing_type, process_type, quantity,
      pickup_address, delivery_address,
    } = req.body

    if (!clothing_type || !process_type || !quantity) {
      res.status(400).json({ success: false, error: '衣物类型、处理方式和数量为必填项' })
      return
    }

    const prices = LAUNDRY_PRICES[clothing_type] || LAUNDRY_PRICES.other
    const unitPrice = prices[process_type] || 0
    if (unitPrice === 0) {
      res.status(400).json({ success: false, error: `该衣物类型不支持${process_type}处理方式` })
      return
    }

    const estimatedPrice = unitPrice * quantity

    const db = getDb()
    const id = uuidv4()
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

    db.prepare(`
      INSERT INTO laundry_orders (id, user_id, compartment_id, clothing_type, process_type, quantity,
        pickup_address, delivery_address, status, quality_note, estimated_price, final_price, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_pickup', '', ?, 0, ?, ?)
    `).run(id, req.user!.id, compartment_id || null, clothing_type, process_type, quantity,
      pickup_address || '', delivery_address || '', estimatedPrice, now, now)

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, content, is_read, created_at)
      VALUES (?, ?, 'laundry_update', '洗衣订单已创建', ?, 0, ?)
    `).run(uuidv4(), req.user!.id, `您的${quantity}件${clothing_type}洗衣订单已创建，预计费用${estimatedPrice}元`, now)

    const order = db.prepare(`
      SELECT lo.*, cmp.code as compartment_code
      FROM laundry_orders lo
      LEFT JOIN compartments cmp ON lo.compartment_id = cmp.id
      WHERE lo.id = ?
    `).get(id)

    res.status(201).json({ success: true, data: order })
  } catch (error) {
    console.error('Create laundry order error:', error)
    res.status(500).json({ success: false, error: '创建洗衣订单失败' })
  }
})

router.get('/orders', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { user_id, status } = req.query
    const db = getDb()

    let sql = `
      SELECT lo.*, cmp.code as compartment_code
      FROM laundry_orders lo
      LEFT JOIN compartments cmp ON lo.compartment_id = cmp.id
      WHERE 1=1
    `
    const params: unknown[] = []

    if (user_id) {
      sql += ' AND lo.user_id = ?'
      params.push(user_id)
    } else if (req.user!.role === 'user') {
      sql += ' AND lo.user_id = ?'
      params.push(req.user!.id)
    }

    if (status) {
      sql += ' AND lo.status = ?'
      params.push(status)
    }

    sql += ' ORDER BY lo.created_at DESC'
    const orders = db.prepare(sql).all(...params)

    res.json({ success: true, data: orders })
  } catch (error) {
    console.error('List laundry orders error:', error)
    res.status(500).json({ success: false, error: '获取洗衣订单列表失败' })
  }
})

router.get('/orders/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const order = db.prepare(`
      SELECT lo.*, cmp.code as compartment_code, cmp.size as compartment_size, c.name as cabinet_name
      FROM laundry_orders lo
      LEFT JOIN compartments cmp ON lo.compartment_id = cmp.id
      LEFT JOIN cabinets c ON cmp.cabinet_id = c.id
      WHERE lo.id = ?
    `).get(req.params.id)

    if (!order) {
      res.status(404).json({ success: false, error: '洗衣订单不存在' })
      return
    }

    res.json({ success: true, data: order })
  } catch (error) {
    console.error('Get laundry order error:', error)
    res.status(500).json({ success: false, error: '获取洗衣订单详情失败' })
  }
})

router.put('/orders/:id/status', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { status } = req.body
    const db = getDb()

    const order = db.prepare('SELECT * FROM laundry_orders WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!order) {
      res.status(404).json({ success: false, error: '洗衣订单不存在' })
      return
    }

    const currentStatus = order.status as string
    const allowed = VALID_STATUS_TRANSITIONS[currentStatus]
    if (!allowed || !allowed.includes(status)) {
      res.status(400).json({
        success: false,
        error: `不允许从 ${currentStatus} 变更为 ${status}，允许: ${allowed?.join(', ') || '无'}`,
      })
      return
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

    const updateOrder = db.transaction(() => {
      db.prepare('UPDATE laundry_orders SET status = ?, updated_at = ? WHERE id = ?').run(status, now, req.params.id)

      const statusMessages: Record<string, string> = {
        picked_up: '已取衣，等待质量检查',
        quality_check: '质量检查中',
        processing: '正在处理中',
        ready_delivery: '处理完成，等待配送',
        delivered: '已配送完成',
      }

      if (statusMessages[status]) {
        db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, content, is_read, created_at)
          VALUES (?, ?, 'laundry_update', '洗衣订单更新', ?, 0, ?)
        `).run(uuidv4(), order.user_id as string, `您的洗衣订单${statusMessages[status]}`, now)
      }

      if (status === 'delivered' && order.estimated_price) {
        db.prepare('UPDATE laundry_orders SET final_price = ? WHERE id = ? AND final_price = 0')
          .run(order.estimated_price, req.params.id)
      }
    })

    updateOrder()

    const updated = db.prepare('SELECT * FROM laundry_orders WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Update laundry order status error:', error)
    res.status(500).json({ success: false, error: '更新洗衣订单状态失败' })
  }
})

router.put('/orders/:id/quality-check', authMiddleware, adminOnly, (req: Request, res: Response): void => {
  try {
    const { quality_note } = req.body
    const db = getDb()

    const order = db.prepare('SELECT * FROM laundry_orders WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!order) {
      res.status(404).json({ success: false, error: '洗衣订单不存在' })
      return
    }

    if (order.status !== 'picked_up' && order.status !== 'quality_check') {
      res.status(400).json({ success: false, error: '当前状态不支持质量检查' })
      return
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    db.prepare('UPDATE laundry_orders SET quality_note = ?, status = ?, updated_at = ? WHERE id = ?')
      .run(quality_note || '', 'quality_check', now, req.params.id)

    const updated = db.prepare('SELECT * FROM laundry_orders WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Quality check error:', error)
    res.status(500).json({ success: false, error: '记录质量检查失败' })
  }
})

router.put('/orders/:id/price', authMiddleware, adminOnly, (req: Request, res: Response): void => {
  try {
    const { estimated_price, final_price } = req.body
    const db = getDb()

    const order = db.prepare('SELECT * FROM laundry_orders WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!order) {
      res.status(404).json({ success: false, error: '洗衣订单不存在' })
      return
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    if (estimated_price !== undefined) {
      db.prepare('UPDATE laundry_orders SET estimated_price = ?, updated_at = ? WHERE id = ?').run(estimated_price, now, req.params.id)
    }
    if (final_price !== undefined) {
      db.prepare('UPDATE laundry_orders SET final_price = ?, updated_at = ? WHERE id = ?').run(final_price, now, req.params.id)
    }

    const updated = db.prepare('SELECT * FROM laundry_orders WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Update price error:', error)
    res.status(500).json({ success: false, error: '更新价格失败' })
  }
})

export default router
