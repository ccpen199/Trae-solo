import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

function calculateMatchScore(driver: any, order: any): number {
  let score = 0
  if (driver.idle_status === 'idle') score += 30
  else if (driver.idle_status === 'busy') score += 5
  score += (driver.credit_score / 100) * 25
  score += (driver.on_time_rate / 100) * 20
  score -= driver.complaint_rate * 100
  score -= driver.violation_count * 3
  const compatibleTypes: Record<string, string[]> = {
    '建材': ['重型平板', '大型集装箱'],
    '生鲜': ['中型厢式', '轻型冷藏'],
    '冷链': ['轻型冷藏'],
    '大件': ['重型平板', '大型集装箱'],
    '电子': ['中型厢式'],
    '化工': ['危险品罐车'],
  }
  const compat = compatibleTypes[order.cargo_type] || []
  if (compat.length === 0 || compat.includes(driver.vehicle_type)) score += 15
  if (driver.capacity >= order.weight) score += 10
  else score -= 10
  return Math.max(0, Math.min(100, Math.round(score)))
}

router.post('/publish', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId
    const { from, to, cargoType, weight, volume, price, mode, deadline, requirements } = req.body
    if (!from || !to || !cargoType || !weight || !price || !mode) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }
    const result = db.prepare(`
      INSERT INTO orders (shipper_id, from_city, to_city, cargo_type, weight, volume, price, mode, deadline)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, from, to, cargoType, weight, volume || null, price, mode, deadline || null)
    const orderId = Number(result.lastInsertRowid)

    const drivers = db.prepare(`
      SELECT dp.*, dl.latitude, dl.longitude, dl.idle_status, u.name, u.phone
      FROM driver_profiles dp
      JOIN driver_locations dl ON dl.driver_id = dp.id
      JOIN users u ON dp.user_id = u.id
      WHERE dp.status = 'approved'
    `).all() as any[]

    const order = { cargo_type: cargoType, weight }
    const matches = drivers.map(d => ({
      driverId: d.id,
      name: d.name,
      phone: d.phone,
      vehicleType: d.vehicle_type,
      capacity: d.capacity,
      creditScore: d.credit_score,
      idleStatus: d.idle_status,
      latitude: d.latitude,
      longitude: d.longitude,
      matchScore: calculateMatchScore(d, order),
    })).sort((a, b) => b.matchScore - a.matchScore).slice(0, 5)

    res.status(201).json({ success: true, orderId, matches })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/matches/:orderId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.orderId) as any
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }
    const drivers = db.prepare(`
      SELECT dp.*, dl.latitude, dl.longitude, dl.idle_status, u.name, u.phone
      FROM driver_profiles dp
      JOIN driver_locations dl ON dl.driver_id = dp.id
      JOIN users u ON dp.user_id = u.id
      WHERE dp.status = 'approved'
    `).all() as any[]

    const matches = drivers.map(d => ({
      driverId: d.id,
      name: d.name,
      phone: d.phone,
      vehicleType: d.vehicle_type,
      capacity: d.capacity,
      creditScore: d.credit_score,
      idleStatus: d.idle_status,
      latitude: d.latitude,
      longitude: d.longitude,
      matchScore: calculateMatchScore(d, order),
    })).sort((a, b) => b.matchScore - a.matchScore).slice(0, 5)

    res.json({ success: true, matches })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/accept', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, driverId, proposedPrice } = req.body
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }
    const driver = db.prepare('SELECT * FROM driver_profiles WHERE id = ?').get(driverId) as any
    if (!driver) {
      res.status(404).json({ success: false, error: '司机不存在' })
      return
    }
    const shipperPrice = order.price
    const driverPrice = proposedPrice || shipperPrice * 0.9
    const result = db.prepare(`
      INSERT INTO bargainings (order_id, driver_id, shipper_price, driver_price, status, offers)
      VALUES (?, ?, ?, ?, 'negotiating', ?)
    `).run(orderId, driverId, shipperPrice, driverPrice, JSON.stringify([
      { role: 'shipper', price: shipperPrice, time: new Date().toISOString() },
      { role: 'driver', price: driverPrice, time: new Date().toISOString() },
    ]))
    res.json({ success: true, bargainingId: Number(result.lastInsertRowid) })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/search-drivers', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicleType, minCapacity } = req.body
    let sql = `
      SELECT dp.id, dp.vehicle_type, dp.capacity, dp.credit_score, dp.plate_no,
             dl.latitude, dl.longitude, dl.idle_status, u.name, u.phone
      FROM driver_profiles dp
      JOIN driver_locations dl ON dl.driver_id = dp.id
      JOIN users u ON dp.user_id = u.id
      WHERE dp.status = 'approved' AND dl.idle_status = 'idle'
    `
    const params: any[] = []
    if (vehicleType) { sql += ' AND dp.vehicle_type = ?'; params.push(vehicleType) }
    if (minCapacity) { sql += ' AND dp.capacity >= ?'; params.push(minCapacity) }
    const drivers = db.prepare(sql).all(...params)
    res.json({ success: true, drivers })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
