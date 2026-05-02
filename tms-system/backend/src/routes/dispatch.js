import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../models/database.js'
import { SmartDispatchEngine } from '../engines/smartDispatch.js'

const router = express.Router()
const dispatchEngine = new SmartDispatchEngine()

router.get('/tasks', (req, res) => {
  try {
    const tasks = db.prepare(`
      SELECT ot.*, o.order_no, o.goods_name, o.weight, o.volume, o.pickup_city, o.delivery_city, o.pickup_address, o.delivery_address, o.pickup_time
      FROM orders o
      WHERE o.status = 'PENDING'
      ORDER BY o.priority DESC, o.pickup_time ASC
    `).all()

    res.json({ data: tasks })
  } catch (error) {
    res.status(500).json({ message: '获取待调度任务失败' })
  }
})

router.get('/recommend', (req, res) => {
  try {
    const { orderId, pickupLat, pickupLng, weight, volume } = req.query

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
    if (!order) {
      return res.status(404).json({ message: '订单不存在' })
    }

    const recommendation = dispatchEngine.recommend({
      order,
      availableVehicles: db.prepare("SELECT * FROM vehicles WHERE status = 'AVAILABLE'").all(),
      availableDrivers: db.prepare("SELECT * FROM drivers WHERE status = 'AVAILABLE'").all(),
      routes: db.prepare("SELECT * FROM routes WHERE status = 'ACTIVE'").all()
    })

    res.json({ data: recommendation })
  } catch (error) {
    console.error('Recommend error:', error)
    res.status(500).json({ message: '获取推荐失败' })
  }
})

router.post('/assign', (req, res) => {
  try {
    const { orderId, vehicleId, driverId } = req.body

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
    if (!order) {
      return res.status(404).json({ message: '订单不存在' })
    }

    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicleId)
    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driverId)

    if (!vehicle || !driver) {
      return res.status(400).json({ message: '车辆或司机不存在' })
    }

    const waybillId = uuidv4()
    const waybillNo = `WB-${Date.now().toString(36).toUpperCase()}`

    db.prepare(`
      INSERT INTO waybills (id, waybill_no, order_id, order_no, vehicle_id, vehicle_no, driver_id, driver_name, driver_phone, status, assigned_at, dispatcher_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ASSIGNED', CURRENT_TIMESTAMP, ?)
    `).run(waybillId, waybillNo, order.id, order.order_no, vehicle.id, vehicle.vehicle_no, driver.id, driver.name, driver.phone, req.body.dispatcherId || null)

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('DISPATCHED', order.id)
    db.prepare("UPDATE vehicles SET status = 'IN_USE', current_driver_id = ? WHERE id = ?").run(driver.id, vehicle.id)
    db.prepare("UPDATE drivers SET status = 'ON_DUTY', current_waybill_id = ? WHERE id = ?").run(waybillId, driver.id)

    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(waybillId)

    res.json({ data: waybill })
  } catch (error) {
    console.error('Assign error:', error)
    res.status(500).json({ message: '调度失败' })
  }
})

router.post('/batch', (req, res) => {
  try {
    const { assignments } = req.body
    const results = []

    for (const { orderId, vehicleId, driverId } of assignments) {
      try {
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
        if (!order) continue

        const waybillId = uuidv4()
        const waybillNo = `WB-${Date.now().toString(36).toUpperCase()}`

        db.prepare(`
          INSERT INTO waybills (id, waybill_no, order_id, order_no, vehicle_id, vehicle_no, driver_id, driver_name, driver_phone, status, assigned_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ASSIGNED', CURRENT_TIMESTAMP)
        `).run(waybillId, waybillNo, order.id, order.order_no, vehicleId, db.prepare('SELECT vehicle_no FROM vehicles WHERE id = ?').get(vehicleId)?.vehicle_no, driverId, db.prepare('SELECT name FROM drivers WHERE id = ?').get(driverId)?.name, db.prepare('SELECT phone FROM drivers WHERE id = ?').get(driverId)?.phone)

        db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('DISPATCHED', order.id)
        results.push({ orderId, success: true })
      } catch (e) {
        results.push({ orderId, success: false, error: e.message })
      }
    }

    res.json({ data: results })
  } catch (error) {
    res.status(500).json({ message: '批量调度失败' })
  }
})

router.get('/history', (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const offset = (page - 1) * pageSize

    const history = db.prepare(`
      SELECT w.*, v.vehicle_no, d.name as driver_name
      FROM waybills w
      LEFT JOIN vehicles v ON w.vehicle_id = v.id
      LEFT JOIN drivers d ON w.driver_id = d.id
      ORDER BY w.assigned_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(pageSize), offset)

    res.json({ data: history })
  } catch (error) {
    res.status(500).json({ message: '获取调度历史失败' })
  }
})

export default router
