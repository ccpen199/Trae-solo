import express from 'express'
import { db } from '../models/database.js'

const router = express.Router()

router.get('/orders', (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    const offset = (page - 1) * pageSize

    const total = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status IS NOT NULL').get().count
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?').all(parseInt(pageSize), offset)

    res.json({ data: orders, total })
  } catch (error) {
    res.status(500).json({ message: '获取订单列表失败' })
  }
})

router.get('/orders/:id', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
    if (!order) {
      return res.status(404).json({ message: '订单不存在' })
    }

    const waybill = db.prepare('SELECT * FROM waybills WHERE order_id = ?').get(req.params.id)

    res.json({ data: { ...order, waybill } })
  } catch (error) {
    res.status(500).json({ message: '获取订单详情失败' })
  }
})

router.get('/track/:orderId', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.orderId)
    if (!order) {
      return res.status(404).json({ message: '订单不存在' })
    }

    const waybill = db.prepare('SELECT * FROM waybills WHERE order_id = ?').get(req.params.orderId)
    if (!waybill) {
      return res.json({ data: { order, waybill: null, current_location: null, timeline: [] } })
    }

    const latestTrack = db.prepare('SELECT * FROM gps_tracks WHERE waybill_id = ? ORDER BY recorded_at DESC LIMIT 1').get(waybill.id)

    const timeline = []
    if (waybill.assigned_at) timeline.push({ title: '已分配司机', time: waybill.assigned_at })
    if (waybill.accepted_at) timeline.push({ title: '司机已接单', time: waybill.accepted_at })
    if (waybill.picked_up_at) timeline.push({ title: '已提货', time: waybill.picked_up_at })
    if (waybill.departed_at) timeline.push({ title: '已出发', time: waybill.departed_at })
    if (waybill.arrived_at) timeline.push({ title: '已到达', time: waybill.arrived_at })
    if (waybill.signed_at) timeline.push({ title: '已签收', time: waybill.signed_at })

    res.json({
      data: {
        order,
        waybill,
        current_location: latestTrack ? { address: latestTrack.address, lat: latestTrack.lat, lng: latestTrack.lng, speed: latestTrack.speed } : null,
        timeline,
        vehicle_no: waybill.vehicle_no,
        driver_name: waybill.driver_name,
        driver_phone: waybill.driver_phone,
        status: waybill.status
      }
    })
  } catch (error) {
    res.status(500).json({ message: '获取追踪信息失败' })
  }
})

router.get('/waybill/:id', (req, res) => {
  try {
    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id)
    if (!waybill) {
      return res.status(404).json({ message: '运单不存在' })
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(waybill.order_id)
    const receipt = db.prepare('SELECT * FROM receipts WHERE waybill_id = ?').get(req.params.id)

    res.json({ data: { ...waybill, order, receipt } })
  } catch (error) {
    res.status(500).json({ message: '获取运单详情失败' })
  }
})

router.get('/waybill/:id/track', (req, res) => {
  try {
    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id)
    if (!waybill) {
      return res.status(404).json({ message: '运单不存在' })
    }

    const tracks = db.prepare('SELECT * FROM gps_tracks WHERE waybill_id = ? ORDER BY recorded_at ASC').all(req.params.id)

    res.json({ data: tracks })
  } catch (error) {
    res.status(500).json({ message: '获取轨迹失败' })
  }
})

router.get('/statements', (req, res) => {
  try {
    const statements = db.prepare('SELECT * FROM statements ORDER BY created_at DESC').all()
    statements.forEach(s => { s.line_items = JSON.parse(s.line_items || '[]') })
    res.json({ data: statements })
  } catch (error) {
    res.status(500).json({ message: '获取对账单失败' })
  }
})

router.get('/statements/:id', (req, res) => {
  try {
    const statement = db.prepare('SELECT * FROM statements WHERE id = ?').get(req.params.id)
    if (!statement) {
      return res.status(404).json({ message: '对账单不存在' })
    }
    statement.line_items = JSON.parse(statement.line_items || '[]')
    res.json({ data: statement })
  } catch (error) {
    res.status(500).json({ message: '获取对账单详情失败' })
  }
})

router.post('/statements/:id/confirm', (req, res) => {
  try {
    db.prepare("UPDATE statements SET status = 'CONFIRMED' WHERE id = ?").run(req.params.id)
    const statement = db.prepare('SELECT * FROM statements WHERE id = ?').get(req.params.id)
    statement.line_items = JSON.parse(statement.line_items || '[]')
    res.json({ data: statement })
  } catch (error) {
    res.status(500).json({ message: '确认对账单失败' })
  }
})

export default router
