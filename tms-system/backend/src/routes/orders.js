import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../models/database.js'

const router = express.Router()

router.get('/', (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, orderNo, customerName, startDate, endDate } = req.query
    const offset = (page - 1) * pageSize

    let whereClause = '1=1'
    const params = []

    if (status) {
      whereClause += ' AND status = ?'
      params.push(status)
    }
    if (orderNo) {
      whereClause += ' AND order_no LIKE ?'
      params.push(`%${orderNo}%`)
    }
    if (customerName) {
      whereClause += ' AND customer_name LIKE ?'
      params.push(`%${customerName}%`)
    }
    if (startDate) {
      whereClause += ' AND created_at >= ?'
      params.push(startDate)
    }
    if (endDate) {
      whereClause += ' AND created_at <= ?'
      params.push(endDate)
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE ${whereClause}`).get(...params).count
    const orders = db.prepare(`SELECT * FROM orders WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset)

    res.json({ data: orders, total, page: parseInt(page), pageSize: parseInt(pageSize) })
  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({ message: '获取订单列表失败' })
  }
})

router.get('/:id', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
    if (!order) {
      return res.status(404).json({ message: '订单不存在' })
    }
    res.json({ data: order })
  } catch (error) {
    res.status(500).json({ message: '获取订单详情失败' })
  }
})

router.post('/', (req, res) => {
  try {
    const id = uuidv4()
    const orderNo = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`

    const {
      customer_id, customer_name, customer_contact, customer_phone,
      pickup_address, pickup_city, pickup_district, pickup_contact, pickup_phone, pickup_lat, pickup_lng, pickup_time,
      delivery_address, delivery_city, delivery_district, delivery_contact, delivery_phone, delivery_lat, delivery_lng,
      goods_type, goods_name, weight, volume, quantity, package_type, declared_value, priority, created_by
    } = req.body

    db.prepare(`
      INSERT INTO orders (id, order_no, customer_id, customer_name, customer_contact, customer_phone,
        pickup_address, pickup_city, pickup_district, pickup_contact, pickup_phone, pickup_lat, pickup_lng, pickup_time,
        delivery_address, delivery_city, delivery_district, delivery_contact, delivery_phone, delivery_lat, delivery_lng,
        goods_type, goods_name, weight, volume, quantity, package_type, declared_value, priority, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, orderNo, customer_id, customer_name, customer_contact, customer_phone,
      pickup_address, pickup_city, pickup_district, pickup_contact, pickup_phone, pickup_lat, pickup_lng, pickup_time,
      delivery_address, delivery_city, delivery_district, delivery_contact, delivery_phone, delivery_lat, delivery_lng,
      goods_type, goods_name, weight || 0, volume || 0, quantity || 1, package_type, declared_value || 0, priority || 'NORMAL', created_by
    )

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
    res.json({ data: order })
  } catch (error) {
    console.error('Create order error:', error)
    res.status(500).json({ message: '创建订单失败' })
  }
})

router.put('/:id', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
    if (!order) {
      return res.status(404).json({ message: '订单不存在' })
    }

    const updates = []
    const values = []

    for (const [key, value] of Object.entries(req.body)) {
      if (value !== undefined && ['customer_name', 'customer_contact', 'customer_phone', 'pickup_address', 'pickup_city', 'delivery_address', 'delivery_city', 'goods_name', 'weight', 'volume', 'quantity', 'status', 'priority'].includes(key)) {
        updates.push(`${key} = ?`)
        values.push(value)
      }
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(req.params.id)
      db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    }

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
    res.json({ data: updatedOrder })
  } catch (error) {
    res.status(500).json({ message: '更新订单失败' })
  }
})

router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id)
    res.json({ message: '删除成功' })
  } catch (error) {
    res.status(500).json({ message: '删除订单失败' })
  }
})

router.post('/:id/dispatch', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
    if (!order) {
      return res.status(404).json({ message: '订单不存在' })
    }

    const { vehicle_id, driver_id } = req.body

    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id)
    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driver_id)

    if (!vehicle || !driver) {
      return res.status(400).json({ message: '车辆或司机不存在' })
    }

    const waybillId = uuidv4()
    const waybillNo = `WB-${uuidv4().slice(0, 8).toUpperCase()}`

    db.prepare(`
      INSERT INTO waybills (id, waybill_no, order_id, order_no, vehicle_id, vehicle_no, driver_id, driver_name, driver_phone, status, assigned_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ASSIGNED', CURRENT_TIMESTAMP)
    `).run(waybillId, waybillNo, order.id, order.order_no, vehicle.id, vehicle.vehicle_no, driver.id, driver.name, driver.phone)

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('DISPATCHED', order.id)

    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(waybillId)
    res.json({ data: waybill })
  } catch (error) {
    console.error('Dispatch order error:', error)
    res.status(500).json({ message: '调度失败' })
  }
})

router.post('/:id/cancel', (req, res) => {
  try {
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('CANCELLED', req.params.id)
    res.json({ message: '订单已取消' })
  } catch (error) {
    res.status(500).json({ message: '取消失败' })
  }
})

export default router
