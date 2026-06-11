import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'

const router = Router()

const activeOrders = new Map<string, { startTime: number; pilePower: number; pricePerKwh: number }>()

router.post('/start', (req: Request, res: Response): void => {
  try {
    const { userId, pileId } = req.body
    if (!userId || !pileId) {
      res.status(400).json({ success: false, error: '缺少 userId 或 pileId' })
      return
    }

    const pile = db.prepare('SELECT * FROM charging_piles WHERE id = ?').get(pileId) as any | undefined
    if (!pile) {
      res.status(404).json({ success: false, error: '充电桩未找到' })
      return
    }
    if (pile.status !== '空闲') {
      res.status(400).json({ success: false, error: '该充电桩当前不可用' })
      return
    }

    const orderId = uuidv4()
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    db.prepare(`
      INSERT INTO charging_orders (id, user_id, pile_id, station_id, start_time, status)
      VALUES (?, ?, ?, ?, ?, '充电中')
    `).run(orderId, userId, pileId, pile.station_id, now)

    db.prepare('UPDATE charging_piles SET status = ? WHERE id = ?').run('充电中', pileId)

    activeOrders.set(orderId, {
      startTime: Date.now(),
      pilePower: pile.power_kw,
      pricePerKwh: pile.price_per_kwh,
    })

    res.json({ success: true, data: { orderId, startTime: now, pileCode: pile.code, powerKw: pile.power_kw, pricePerKwh: pile.price_per_kwh } })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/:id/status', (req: Request, res: Response): void => {
  try {
    const order = db.prepare('SELECT * FROM charging_orders WHERE id = ?').get(req.params.id) as any | undefined
    if (!order) {
      res.status(404).json({ success: false, error: '订单未找到' })
      return
    }

    if (order.status === '充电中') {
      const active = activeOrders.get(order.id)
      if (active) {
        const elapsedMin = (Date.now() - active.startTime) / 60000
        const chargedKwh = +((active.pilePower * elapsedMin) / 60 * (0.85 + Math.random() * 0.1)).toFixed(2)
        const cost = +(chargedKwh * active.pricePerKwh).toFixed(2)
        const progress = Math.min(95, +(elapsedMin / (60 + Math.random() * 30) * 100).toFixed(1))

        res.json({
          success: true,
          data: {
            ...order,
            charged_kwh: chargedKwh,
            cost,
            progress,
            estimated_remaining_min: Math.max(5, +(60 - elapsedMin).toFixed(0)),
            current_power_kw: +(active.pilePower * (0.8 + Math.random() * 0.2)).toFixed(1),
            voltage: +(350 + Math.random() * 100).toFixed(0),
            current: +(100 + Math.random() * 150).toFixed(1),
            temperature: +(25 + Math.random() * 15).toFixed(1),
          },
        })
        return
      }
    }

    res.json({ success: true, data: { ...order, progress: order.status === '已完成' ? 100 : 0 } })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/:id/stop', (req: Request, res: Response): void => {
  try {
    const order = db.prepare('SELECT * FROM charging_orders WHERE id = ?').get(req.params.id) as any | undefined
    if (!order) {
      res.status(404).json({ success: false, error: '订单未找到' })
      return
    }
    if (order.status !== '充电中') {
      res.status(400).json({ success: false, error: '该订单不在充电中' })
      return
    }

    const active = activeOrders.get(order.id)
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    let chargedKwh = 0
    let cost = 0

    if (active) {
      const elapsedMin = (Date.now() - active.startTime) / 60000
      chargedKwh = +((active.pilePower * elapsedMin) / 60 * 0.9).toFixed(2)
      cost = +(chargedKwh * active.pricePerKwh).toFixed(2)
      activeOrders.delete(order.id)
    }

    db.prepare(`
      UPDATE charging_orders SET status = '已完成', end_time = ?, charged_kwh = ?, cost = ? WHERE id = ?
    `).run(now, chargedKwh, cost, order.id)

    db.prepare('UPDATE charging_piles SET status = ? WHERE id = ?').run('空闲', order.pile_id)

    res.json({ success: true, data: { orderId: order.id, endTime: now, chargedKwh, cost } })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/', (req: Request, res: Response): void => {
  try {
    const { userId, status, page = '1', pageSize = '10' } = req.query
    let sql = `
      SELECT co.*, cs.name as station_name, cp.code as pile_code
      FROM charging_orders co
      JOIN charging_stations cs ON co.station_id = cs.id
      JOIN charging_piles cp ON co.pile_id = cp.id
      WHERE 1=1
    `
    const params: any[] = []

    if (userId) {
      sql += ' AND co.user_id = ?'
      params.push(userId)
    }
    if (status) {
      sql += ' AND co.status = ?'
      params.push(status)
    }

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM (${sql})`).get(...params) as { total: number }
    const total = countResult.total

    sql += ' ORDER BY co.created_at DESC LIMIT ? OFFSET ?'
    const limit = parseInt(pageSize as string, 10)
    const offset = (parseInt(page as string, 10) - 1) * limit
    params.push(limit, offset)

    const orders = db.prepare(sql).all(...params)

    res.json({
      success: true,
      data: {
        list: orders,
        total,
        page: parseInt(page as string, 10),
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
