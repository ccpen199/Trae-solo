import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

interface OrderRow {
  id: number
  device_id: number
  port_id: number
  site_id: number
  start_time: string
  end_time: string | null
  duration: number
  energy: number
  cost: number
  stop_reason: string | null
  refund_status: string
  refund_amount: number
  status: string
  created_at: string
  updated_at: string
}

interface SiteRow {
  id: number
  name: string
  address: string
  operator: string
  device_count: number
  electricity_price: number
  service_fee: number
  business_hours_start: string
  business_hours_end: string
  status: string
  created_at: string
  updated_at: string
}

interface PortRow {
  id: number
  device_id: number
  port_number: number
  status: string
  connector_type: string
  created_at: string
}

router.get('/stats', (req: Request, res: Response): void => {
  try {
    const db = getDb()

    const totalOrders = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number }).count
    const chargingOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'charging'").get() as { count: number }).count
    const completedOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'").get() as { count: number }).count
    const refundedOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'refunded'").get() as { count: number }).count
    const totalRevenue = (db.prepare('SELECT COALESCE(SUM(cost), 0) as total FROM orders WHERE status IN (\'completed\', \'refunded\')').get() as { total: number }).total
    const totalEnergy = (db.prepare('SELECT COALESCE(SUM(energy), 0) as total FROM orders').get() as { total: number }).total
    const totalRefund = (db.prepare("SELECT COALESCE(SUM(refund_amount), 0) as total FROM orders WHERE refund_status != 'none'").get() as { total: number }).total
    const avgDuration = (db.prepare('SELECT COALESCE(AVG(duration), 0) as avg FROM orders WHERE status = \'completed\'').get() as { avg: number }).avg

    const todayOrders = (db.prepare(
      "SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = DATE('now')",
    ).get() as { count: number }).count

    const todayRevenue = (db.prepare(
      "SELECT COALESCE(SUM(cost), 0) as total FROM orders WHERE DATE(created_at) = DATE('now') AND status IN ('completed', 'refunded')",
    ).get() as { total: number }).total

    res.json({
      success: true,
      data: {
        totalOrders,
        chargingOrders,
        completedOrders,
        refundedOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalEnergy: Math.round(totalEnergy * 100) / 100,
        totalRefund: Math.round(totalRefund * 100) / 100,
        avgDuration: Math.round(avgDuration * 100) / 100,
        todayOrders,
        todayRevenue: Math.round(todayRevenue * 100) / 100,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { site_id, device_id, status, start_date, end_date } = req.query
    let sql = 'SELECT o.*, d.name as device_name, s.name as site_name, s.electricity_price, s.service_fee FROM orders o LEFT JOIN devices d ON o.device_id = d.id LEFT JOIN sites s ON o.site_id = s.id'
    const params: unknown[] = []
    const conditions: string[] = []

    if (site_id) {
      conditions.push('o.site_id = ?')
      params.push(site_id)
    }
    if (device_id) {
      conditions.push('o.device_id = ?')
      params.push(device_id)
    }
    if (status) {
      conditions.push('o.status = ?')
      params.push(status)
    }
    if (start_date) {
      conditions.push('DATE(o.start_time) >= ?')
      params.push(start_date)
    }
    if (end_date) {
      conditions.push('DATE(o.start_time) <= ?')
      params.push(end_date)
    }
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }
    sql += ' ORDER BY o.created_at DESC'

    const orders = db.prepare(sql).all(...params) as Array<Record<string, unknown>>
    const ordersWithDetails = orders.map((o) => {
      const order = o as Record<string, unknown>
      const energy = order.energy as number
      const electricityPrice = order.electricity_price as number
      const serviceFee = order.service_fee as number
      const cost = order.cost as number
      return {
        ...order,
        scan_time: order.start_time,
        charge_start_time: order.start_time,
        fee_breakdown: {
          electricity_cost: Math.round(energy * electricityPrice * 100) / 100,
          service_cost: Math.round(energy * serviceFee * 100) / 100,
          total_cost: cost,
        },
      }
    })
    res.json({ success: true, data: ordersWithDetails })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as OrderRow | undefined

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' })
      return
    }

    const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(order.site_id) as SiteRow | undefined
    const electricityPrice = site?.electricity_price ?? 0
    const serviceFee = site?.service_fee ?? 0

    const orderWithDetails = {
      ...order,
      scan_time: order.start_time,
      charge_start_time: order.start_time,
      fee_breakdown: {
        electricity_cost: Math.round(order.energy * electricityPrice * 100) / 100,
        service_cost: Math.round(order.energy * serviceFee * 100) / 100,
        total_cost: order.cost,
      },
    }

    res.json({ success: true, data: orderWithDetails })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { device_id, port_id, site_id } = req.body

    if (!device_id || !port_id) {
      res.status(400).json({ success: false, error: 'device_id and port_id are required' })
      return
    }

    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(device_id) as { site_id: number } | undefined
    if (!device) {
      res.status(400).json({ success: false, error: 'Device not found' })
      return
    }

    const resolvedSiteId = site_id || device.site_id

    const port = db.prepare('SELECT * FROM device_ports WHERE id = ? AND device_id = ?').get(port_id, device_id) as PortRow | undefined
    if (!port) {
      res.status(400).json({ success: false, error: 'Port not found or does not belong to device' })
      return
    }
    if (port.status === 'charging') {
      res.status(400).json({ success: false, error: 'Port is already in use' })
      return
    }

    const result = db.prepare(`
      INSERT INTO orders (device_id, port_id, site_id, status)
      VALUES (?, ?, ?, 'charging')
    `).run(device_id, port_id, resolvedSiteId)

    db.prepare("UPDATE device_ports SET status = 'charging' WHERE id = ?").run(port_id)

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.patch('/:id/stop', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as OrderRow | undefined

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' })
      return
    }
    if (order.status !== 'charging') {
      res.status(400).json({ success: false, error: 'Order is not in charging state' })
      return
    }

    const { energy, stop_reason } = req.body

    const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(order.site_id) as SiteRow | undefined
    const electricityPrice = site?.electricity_price ?? 0
    const serviceFee = site?.service_fee ?? 0

    const now = new Date()
    const startTime = new Date(order.start_time)
    const durationMs = now.getTime() - startTime.getTime()
    const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100
    const energyUsed = energy ?? 0
    const cost = Math.round((energyUsed * (electricityPrice + serviceFee)) * 100) / 100

    db.prepare(`
      UPDATE orders SET
        end_time = CURRENT_TIMESTAMP,
        duration = ?,
        energy = ?,
        cost = ?,
        stop_reason = ?,
        status = 'completed',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(durationHours, energyUsed, cost, stop_reason ?? 'user_stop', req.params.id)

    db.prepare("UPDATE device_ports SET status = 'idle' WHERE id = ?").run(order.port_id)

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.patch('/:id/refund', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as OrderRow | undefined

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' })
      return
    }
    if (order.status !== 'completed' && order.status !== 'refunded') {
      res.status(400).json({ success: false, error: 'Only completed or refunded orders can be refunded' })
      return
    }

    const { refund_amount, refund_status } = req.body

    const resolvedRefundAmount = refund_amount ?? order.cost

    if (resolvedRefundAmount <= 0) {
      res.status(400).json({ success: false, error: 'refund_amount must be greater than 0' })
      return
    }

    db.prepare(`
      UPDATE orders SET
        refund_status = ?,
        refund_amount = ?,
        status = 'refunded',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(refund_status ?? 'partial', resolvedRefundAmount, req.params.id)

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

export default router
