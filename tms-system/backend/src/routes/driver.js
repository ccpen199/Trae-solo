import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../models/database.js'

const router = express.Router()

router.get('/waybills', (req, res) => {
  try {
    const { status, driver_id } = req.query

    let whereClause = "1=1"
    const params = []

    if (driver_id) {
      whereClause += " AND w.driver_id = ?"
      params.push(driver_id)
    }

    if (status === 'pending') {
      whereClause += " AND w.status IN ('ASSIGNED')"
    } else if (status === 'in_progress') {
      whereClause += " AND w.status IN ('ACCEPTED', 'PICKED_UP', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED')"
    } else if (status === 'completed') {
      whereClause += " AND w.status IN ('SIGNED', 'COMPLETED')"
    }

    const waybills = db.prepare(`
      SELECT w.*, o.goods_name, o.weight, o.volume, o.quantity,
             o.pickup_city, o.pickup_address, o.pickup_contact, o.pickup_phone,
             o.delivery_city, o.delivery_address, o.delivery_contact, o.delivery_phone
      FROM waybills w
      LEFT JOIN orders o ON w.order_id = o.id
      WHERE ${whereClause}
      ORDER BY w.assigned_at DESC
    `).all(...params)

    const result = waybills.map(w => {
      const latestTrack = db.prepare('SELECT * FROM gps_tracks WHERE waybill_id = ? ORDER BY recorded_at DESC LIMIT 1').get(w.id)
      return {
        ...w,
        current_location: latestTrack ? { 
          lat: latestTrack.lat, 
          lng: latestTrack.lng, 
          address: latestTrack.address, 
          speed: latestTrack.speed 
        } : null
      }
    })

    res.json({ data: result })
  } catch (error) {
    console.error('Get driver waybills error:', error)
    res.status(500).json({ message: '获取运单列表失败' })
  }
})

router.get('/waybills/:id', (req, res) => {
  try {
    const waybill = db.prepare(`
      SELECT w.*, o.goods_name, o.weight, o.volume, o.quantity, o.declared_value,
             o.pickup_city, o.pickup_address, o.pickup_contact, o.pickup_phone, o.pickup_lat, o.pickup_lng,
             o.delivery_city, o.delivery_address, o.delivery_contact, o.delivery_phone, o.delivery_lat, o.delivery_lng
      FROM waybills w
      LEFT JOIN orders o ON w.order_id = o.id
      WHERE w.id = ?
    `).get(req.params.id)

    if (!waybill) {
      return res.status(404).json({ message: '运单不存在' })
    }

    const latestTrack = db.prepare('SELECT * FROM gps_tracks WHERE waybill_id = ? ORDER BY recorded_at DESC LIMIT 1').get(req.params.id)
    const tracks = db.prepare('SELECT * FROM gps_tracks WHERE waybill_id = ? ORDER BY recorded_at ASC').all(req.params.id)
    const exception = db.prepare("SELECT * FROM exceptions WHERE waybill_id = ? AND status NOT IN ('RESOLVED', 'CLOSED') ORDER BY created_at DESC LIMIT 1").get(req.params.id)
    const receipt = db.prepare('SELECT * FROM receipts WHERE waybill_id = ?').get(req.params.id)

    const timeline = []
    if (waybill.assigned_at) timeline.push({ status: 'ASSIGNED', title: '已分配', time: waybill.assigned_at, description: '运单已分配给司机' })
    if (waybill.accepted_at) timeline.push({ status: 'ACCEPTED', title: '已接单', time: waybill.accepted_at, description: '司机已确认接单' })
    if (waybill.picked_up_at) timeline.push({ status: 'PICKED_UP', title: '已提货', time: waybill.picked_up_at, description: '已到达提货点并完成提货' })
    if (waybill.departed_at) timeline.push({ status: 'DEPARTED', title: '已出发', time: waybill.departed_at, description: '从提货点出发' })
    if (waybill.arrived_at) timeline.push({ status: 'ARRIVED', title: '已到达', time: waybill.arrived_at, description: '已到达收货点' })
    if (waybill.signed_at) timeline.push({ status: 'SIGNED', title: '已签收', time: waybill.signed_at, description: '已完成签收' })
    if (waybill.completed_at) timeline.push({ status: 'COMPLETED', title: '已完成', time: waybill.completed_at, description: '运单已完成' })

    res.json({ 
      data: {
        ...waybill,
        current_location: latestTrack,
        tracks,
        exception,
        receipt,
        timeline
      }
    })
  } catch (error) {
    console.error('Get waybill detail error:', error)
    res.status(500).json({ message: '获取运单详情失败' })
  }
})

router.post('/waybills/:id/accept', (req, res) => {
  try {
    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id)
    if (!waybill) {
      return res.status(404).json({ message: '运单不存在' })
    }

    if (waybill.status !== 'ASSIGNED') {
      return res.status(400).json({ message: '运单状态不允许接单' })
    }

    db.prepare(`
      UPDATE waybills 
      SET status = 'ACCEPTED', accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(req.params.id)

    db.prepare("UPDATE drivers SET status = 'ON_DUTY', current_waybill_id = ? WHERE id = ?").run(req.params.id, waybill.driver_id)

    const updated = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id)
    res.json({ data: updated, message: '接单成功' })
  } catch (error) {
    console.error('Accept waybill error:', error)
    res.status(500).json({ message: '接单失败' })
  }
})

router.post('/waybills/:id/pickup', (req, res) => {
  try {
    const { lat, lng, address } = req.body
    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id)
    
    if (!waybill) {
      return res.status(404).json({ message: '运单不存在' })
    }

    if (!['ACCEPTED', 'PICKED_UP'].includes(waybill.status)) {
      return res.status(400).json({ message: '运单状态不允许提货' })
    }

    db.prepare(`
      UPDATE waybills 
      SET status = 'PICKED_UP', picked_up_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(req.params.id)

    res.json({ message: '提货确认成功' })
  } catch (error) {
    console.error('Pickup waybill error:', error)
    res.status(500).json({ message: '提货确认失败' })
  }
})

router.post('/waybills/:id/depart', (req, res) => {
  try {
    const { lat, lng, address } = req.body
    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id)
    
    if (!waybill) {
      return res.status(404).json({ message: '运单不存在' })
    }

    if (!['PICKED_UP', 'DEPARTED'].includes(waybill.status)) {
      return res.status(400).json({ message: '运单状态不允许出发' })
    }

    db.prepare(`
      UPDATE waybills 
      SET status = 'DEPARTED', departed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(req.params.id)

    res.json({ message: '出发确认成功' })
  } catch (error) {
    console.error('Depart waybill error:', error)
    res.status(500).json({ message: '出发确认失败' })
  }
})

router.post('/waybills/:id/arrive', (req, res) => {
  try {
    const { lat, lng, address } = req.body
    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id)
    
    if (!waybill) {
      return res.status(404).json({ message: '运单不存在' })
    }

    if (!['DEPARTED', 'IN_TRANSIT', 'ARRIVED'].includes(waybill.status)) {
      return res.status(400).json({ message: '运单状态不允许到达' })
    }

    db.prepare(`
      UPDATE waybills 
      SET status = 'ARRIVED', arrived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(req.params.id)

    res.json({ message: '到达确认成功' })
  } catch (error) {
    console.error('Arrive waybill error:', error)
    res.status(500).json({ message: '到达确认失败' })
  }
})

router.post('/waybills/:id/sign', (req, res) => {
  try {
    const { signed_by, signature_data, photos, remark, lat, lng, address } = req.body
    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id)
    
    if (!waybill) {
      return res.status(404).json({ message: '运单不存在' })
    }

    if (!['ARRIVED', 'SIGNED'].includes(waybill.status)) {
      return res.status(400).json({ message: '运单状态不允许签收' })
    }

    const receiptId = uuidv4()
    const receiptNo = `RC-${Date.now()}`

    db.prepare(`
      INSERT INTO receipts (id, receipt_no, waybill_id, signed_by, signed_at, signed_lat, signed_lng, photos, remark, status)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, 'UPLOADED')
    `).run(receiptId, receiptNo, req.params.id, signed_by || '签收人', lat, lng, JSON.stringify(photos || []), remark || '')

    db.prepare(`
      UPDATE waybills 
      SET status = 'SIGNED', signed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(req.params.id)

    const updated = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id)
    res.json({ data: updated, message: '签收成功' })
  } catch (error) {
    console.error('Sign waybill error:', error)
    res.status(500).json({ message: '签收失败' })
  }
})

router.post('/waybills/:id/complete', (req, res) => {
  try {
    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id)
    
    if (!waybill) {
      return res.status(404).json({ message: '运单不存在' })
    }

    if (waybill.status !== 'SIGNED') {
      return res.status(400).json({ message: '运单状态不允许完成' })
    }

    db.prepare(`
      UPDATE waybills 
      SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(req.params.id)

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('COMPLETED', waybill.order_id)
    db.prepare("UPDATE drivers SET status = 'AVAILABLE', current_waybill_id = NULL WHERE id = ?").run(waybill.driver_id)
    db.prepare("UPDATE vehicles SET status = 'AVAILABLE', current_driver_id = NULL WHERE id = ?").run(waybill.vehicle_id)

    const updated = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id)
    res.json({ data: updated, message: '运单已完成' })
  } catch (error) {
    console.error('Complete waybill error:', error)
    res.status(500).json({ message: '完成运单失败' })
  }
})

router.post('/location', (req, res) => {
  try {
    const { lat, lng, address, speed, direction, waybill_id, driver_id, vehicle_id } = req.body

    if (waybill_id) {
      const id = uuidv4()
      db.prepare(`
        INSERT INTO gps_tracks (id, waybill_id, vehicle_id, driver_id, lat, lng, address, speed, direction, location_type, recorded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'NORMAL', CURRENT_TIMESTAMP)
      `).run(id, waybill_id, vehicle_id, driver_id, lat, lng, address, speed, direction)

      db.prepare('UPDATE waybills SET status = ? WHERE id = ? AND status = ?').run('IN_TRANSIT', waybill_id, 'DEPARTED')
      
      if (vehicle_id) {
        db.prepare('UPDATE vehicles SET current_lat = ?, current_lng = ?, current_address = ?, last_location_update = CURRENT_TIMESTAMP WHERE id = ?').run(lat, lng, address, vehicle_id)
      }
      if (driver_id) {
        db.prepare('UPDATE drivers SET current_lat = ?, current_lng = ?, last_location_update = CURRENT_TIMESTAMP WHERE id = ?').run(lat, lng, driver_id)
      }
    }

    res.json({ message: '位置已更新' })
  } catch (error) {
    console.error('Update location error:', error)
    res.status(500).json({ message: '更新位置失败' })
  }
})

router.post('/exception', (req, res) => {
  try {
    const { waybill_id, type, description, report_lat, report_lng, report_address, report_by, images } = req.body

    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(waybill_id)
    if (!waybill) {
      return res.status(404).json({ message: '运单不存在' })
    }

    const id = uuidv4()
    const exceptionNo = `EXP-${Date.now()}`

    db.prepare(`
      INSERT INTO exceptions (id, waybill_id, exception_no, type, description, report_lat, report_lng, report_address, report_by, images, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REPORTED')
    `).run(id, waybill_id, exceptionNo, type, description, report_lat, report_lng, report_address, report_by, JSON.stringify(images || []))

    const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(id)
    res.json({ data: exception, message: '异常已上报' })
  } catch (error) {
    console.error('Report exception error:', error)
    res.status(500).json({ message: '上报异常失败' })
  }
})

router.get('/current', (req, res) => {
  try {
    const { driver_id } = req.query
    
    let currentWaybill = null
    if (driver_id) {
      currentWaybill = db.prepare(`
        SELECT w.*, o.goods_name, o.weight, o.volume,
               o.pickup_city, o.pickup_address,
               o.delivery_city, o.delivery_address
        FROM waybills w
        LEFT JOIN orders o ON w.order_id = o.id
        WHERE w.driver_id = ? AND w.status IN ('ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED')
        ORDER BY w.assigned_at DESC
        LIMIT 1
      `).get(driver_id)
    }

    res.json({ data: currentWaybill })
  } catch (error) {
    console.error('Get current waybill error:', error)
    res.status(500).json({ message: '获取当前运单失败' })
  }
})

export default router
