import { Router, type Request, type Response } from 'express'
import dayjs from 'dayjs'
import db from '../db.js'
import { authMiddleware } from './auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/devices', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const { device_type, status } = req.query

    let sql = 'SELECT * FROM smart_devices WHERE user_id = ?'
    const params: any[] = [userId]

    if (device_type) { sql += ' AND device_type = ?'; params.push(device_type as string) }
    if (status) { sql += ' AND status = ?'; params.push(status as string) }

    sql += ' ORDER BY created_at DESC'
    const devices = db.prepare(sql).all(...params)
    res.json({ success: true, data: devices })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/devices', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const { device_name, device_type, status } = req.body

    if (!device_name || !device_type) {
      res.status(400).json({ success: false, error: '请提供设备名称和类型' })
      return
    }

    const result = db.prepare(`
      INSERT INTO smart_devices (user_id, device_name, device_type, status, power_consumption, last_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, device_name, device_type, status || 'offline', 0, dayjs().format('YYYY-MM-DD HH:mm:ss'))

    const device = db.prepare('SELECT * FROM smart_devices WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: device, message: '设备添加成功' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/devices/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const { device_name, device_type, status, power_consumption } = req.body

    const device = db.prepare('SELECT * FROM smart_devices WHERE id = ? AND user_id = ?').get(req.params.id, userId)
    if (!device) {
      res.status(404).json({ success: false, error: '设备不存在' })
      return
    }

    const updates: string[] = []
    const values: any[] = []

    if (device_name !== undefined) { updates.push('device_name = ?'); values.push(device_name) }
    if (device_type !== undefined) { updates.push('device_type = ?'); values.push(device_type) }
    if (status !== undefined) {
      updates.push('status = ?'); values.push(status)
      updates.push('last_active = ?'); values.push(dayjs().format('YYYY-MM-DD HH:mm:ss'))
    }
    if (power_consumption !== undefined) { updates.push('power_consumption = ?'); values.push(power_consumption) }

    values.push(req.params.id, userId)

    db.prepare(`UPDATE smart_devices SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...values)
    const updated = db.prepare('SELECT * FROM smart_devices WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated, message: '设备更新成功' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/devices/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const device = db.prepare('SELECT * FROM smart_devices WHERE id = ? AND user_id = ?').get(req.params.id, userId)
    if (!device) {
      res.status(404).json({ success: false, error: '设备不存在' })
      return
    }

    db.prepare('DELETE FROM smart_devices WHERE id = ? AND user_id = ?').run(req.params.id, userId)
    res.json({ success: true, message: '设备删除成功' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/tips', async (req: Request, res: Response): Promise<void> => {
  try {
    const { season, category } = req.query
    const customer_type = (req as any).user.customer_type

    let sql = 'SELECT * FROM energy_tips WHERE (customer_type = ? OR customer_type IS NULL)'
    const params: any[] = [customer_type]

    if (season) { sql += ' AND (season = ? OR season IS NULL)'; params.push(season as string) }
    if (category) { sql += ' AND category = ?'; params.push(category as string) }

    sql += ' ORDER BY created_at DESC'
    const tips = db.prepare(sql).all(...params)
    res.json({ success: true, data: tips })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/points', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id

    const user = db.prepare('SELECT points_balance FROM users WHERE id = ?').get(userId)
    const transactions = db.prepare('SELECT * FROM points_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(userId)

    const summary = db.prepare(`
      SELECT
        SUM(CASE WHEN type = 'earn' THEN amount ELSE 0 END) as total_earned,
        SUM(CASE WHEN type = 'redeem' THEN ABS(amount) ELSE 0 END) as total_redeemed,
        COUNT(*) as transaction_count
      FROM points_transactions WHERE user_id = ?
    `).get(userId)

    res.json({ success: true, data: { balance: (user as any)?.points_balance || 0, transactions, summary } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/mall', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.query
    let sql = 'SELECT * FROM mall_items WHERE stock > 0'
    const params: any[] = []

    if (category) { sql += ' AND category = ?'; params.push(category as string) }
    sql += ' ORDER BY points_required'

    const items = db.prepare(sql).all(...params)
    res.json({ success: true, data: items })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/mall/:id/redeem', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const item = db.prepare('SELECT * FROM mall_items WHERE id = ?').get(req.params.id) as any

    if (!item) {
      res.status(404).json({ success: false, error: '商品不存在' })
      return
    }

    if (item.stock <= 0) {
      res.status(400).json({ success: false, error: '商品库存不足' })
      return
    }

    const user = db.prepare('SELECT points_balance FROM users WHERE id = ?').get(userId) as any
    if (!user || user.points_balance < item.points_required) {
      res.status(400).json({ success: false, error: '积分不足' })
      return
    }

    const tx = db.transaction(() => {
      db.prepare('UPDATE users SET points_balance = points_balance - ? WHERE id = ?').run(item.points_required, userId)
      db.prepare('UPDATE mall_items SET stock = stock - 1 WHERE id = ?').run(item.id)
      db.prepare(`
        INSERT INTO points_transactions (user_id, type, amount, source, description)
        VALUES (?, 'redeem', ?, 'mall', ?)
      `).run(userId, -item.points_required, `兑换${item.name}`)
      const orderId = db.prepare(`
        INSERT INTO redemption_orders (user_id, item_id, points_cost, status)
        VALUES (?, ?, ?, 'pending')
      `).run(userId, item.id, item.points_required).lastInsertRowid
      return orderId
    })

    const orderId = tx()
    res.status(201).json({ success: true, data: { order_id: orderId }, message: '兑换成功' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/points/transactions', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const { type, source, page = 1, page_size = 20 } = req.query

    let countSql = 'SELECT COUNT(*) as count FROM points_transactions WHERE user_id = ?'
    let sql = 'SELECT * FROM points_transactions WHERE user_id = ?'
    const params: any[] = [userId]

    if (type) {
      sql += ' AND type = ?'
      countSql += ' AND type = ?'
      params.push(type as string)
    }
    if (source) {
      sql += ' AND source = ?'
      countSql += ' AND source = ?'
      params.push(source as string)
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    const limit = parseInt(page_size as string)
    const offset = (parseInt(page as string) - 1) * limit
    const queryParams = [...params, limit, offset]

    const transactions = db.prepare(sql).all(...queryParams)
    const countResult = db.prepare(countSql).get(...params) as any
    const total = countResult?.count || 0

    const summary = db.prepare(`
      SELECT
        SUM(CASE WHEN type = 'earn' THEN amount ELSE 0 END) as total_earned,
        SUM(CASE WHEN type = 'redeem' THEN ABS(amount) ELSE 0 END) as total_redeemed,
        COUNT(*) as transaction_count
      FROM points_transactions WHERE user_id = ?
    `).get(userId) as any

    res.json({
      success: true,
      data: {
        list: transactions,
        pagination: {
          page: parseInt(page as string),
          page_size: limit,
          total,
          total_pages: Math.ceil(total / limit)
        },
        summary: {
          total_earned: summary?.total_earned || 0,
          total_redeemed: summary?.total_redeemed || 0,
          transaction_count: summary?.transaction_count || 0
        }
      }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/redemption-orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const user = (req as any).user
    const isAdmin = user.role === 'admin'
    const { status, page = 1, page_size = 20 } = req.query

    let countSql = `
      SELECT COUNT(*) as count 
      FROM redemption_orders ro
      JOIN mall_items mi ON ro.item_id = mi.id
      WHERE 1=1
    `
    let sql = `
      SELECT 
        ro.*, 
        mi.name as item_name,
        mi.description as item_description,
        mi.image_url as item_image,
        mi.category as item_category
      FROM redemption_orders ro
      JOIN mall_items mi ON ro.item_id = mi.id
      WHERE 1=1
    `
    const params: any[] = []

    if (!isAdmin) {
      sql += ' AND ro.user_id = ?'
      countSql += ' AND ro.user_id = ?'
      params.push(userId)
    }

    if (status) {
      sql += ' AND ro.status = ?'
      countSql += ' AND ro.status = ?'
      params.push(status as string)
    }

    sql += ' ORDER BY ro.created_at DESC LIMIT ? OFFSET ?'
    const limit = parseInt(page_size as string)
    const offset = (parseInt(page as string) - 1) * limit
    const queryParams = [...params, limit, offset]

    const orders = db.prepare(sql).all(...queryParams) as any[]
    const countResult = db.prepare(countSql).get(...params) as any
    const total = countResult?.count || 0

    const statusFlow = {
      pending: { name: '待处理', next: 'processed' },
      processed: { name: '已发货', next: 'delivered' },
      delivered: { name: '已送达', next: null },
      cancelled: { name: '已取消', next: null }
    }

    const ordersWithFlow = orders.map(order => ({
      ...order,
      status_name: (statusFlow as any)[order.status]?.name || order.status,
      can_confirm: order.status === 'delivered',
      status_history: buildStatusHistory(order)
    }))

    const statusStats = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM redemption_orders
      ${!isAdmin ? 'WHERE user_id = ?' : ''}
      GROUP BY status
    `).all(...(!isAdmin ? [userId] : []))

    res.json({
      success: true,
      data: {
        list: ordersWithFlow,
        pagination: {
          page: parseInt(page as string),
          page_size: limit,
          total,
          total_pages: Math.ceil(total / limit)
        },
        status_stats: statusStats
      }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

function buildStatusHistory(order: any) {
  const history: any[] = [
    { status: 'pending', time: order.created_at, description: '订单创建' }
  ]

  if (order.status !== 'pending') {
    history.push({
      status: 'processed',
      time: order.created_at ? dayjs(order.created_at).add(1, 'day').format('YYYY-MM-DD HH:mm:ss') : null,
      description: '商家已发货'
    })
  }

  if (order.status === 'delivered' || order.status === 'cancelled') {
    history.push({
      status: order.status === 'delivered' ? 'delivered' : 'cancelled',
      time: order.created_at ? dayjs(order.created_at).add(3, 'day').format('YYYY-MM-DD HH:mm:ss') : null,
      description: order.status === 'delivered' ? '快递已送达' : '订单已取消'
    })
  }

  if (order.confirmed_at) {
    history.push({
      status: 'confirmed',
      time: order.confirmed_at,
      description: '用户已确认收货'
    })
  }

  return history
}

router.post('/redemption-orders/:id/confirm', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const user = (req as any).user
    const isAdmin = user.role === 'admin'
    const orderId = req.params.id

    let orderQuery = 'SELECT * FROM redemption_orders WHERE id = ?'
    const params: any[] = [orderId]
    if (!isAdmin) {
      orderQuery += ' AND user_id = ?'
      params.push(userId)
    }

    const order = db.prepare(orderQuery).get(...params) as any
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    if (order.status !== 'delivered') {
      res.status(400).json({ success: false, error: '只有已送达的订单才能确认收货' })
      return
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

    db.prepare(`
      UPDATE redemption_orders 
      SET confirmed_at = ?
      WHERE id = ?
    `).run(now, orderId)

    db.prepare(`
      INSERT INTO points_transactions (user_id, type, amount, source, description)
      VALUES (?, 'earn', ?, 'order_confirm', ?)
    `).run(userId, 10, `确认收货奖励积分`)

    db.prepare(`
      UPDATE users SET points_balance = points_balance + ? WHERE id = ?
    `).run(10, userId)

    const updatedOrder = db.prepare(`
      SELECT ro.*, mi.name as item_name
      FROM redemption_orders ro
      JOIN mall_items mi ON ro.item_id = mi.id
      WHERE ro.id = ?
    `).get(orderId)

    res.json({
      success: true,
      data: updatedOrder,
      message: '确认收货成功，获得10积分奖励'
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
