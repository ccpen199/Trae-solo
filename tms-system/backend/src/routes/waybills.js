import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../models/database.js'

const router = express.Router()

router.get('/', (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query
    const offset = (page - 1) * pageSize

    let whereClause = '1=1'
    const params = []

    if (status) {
      whereClause += ' AND status = ?'
      params.push(status)
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM waybills WHERE ${whereClause}`).get(...params).count
    const waybills = db.prepare(`SELECT * FROM waybills WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset)

    res.json({ data: waybills, total, page: parseInt(page), pageSize: parseInt(pageSize) })
  } catch (error) {
    res.status(500).json({ message: '获取运单列表失败' })
  }
})

router.get('/:id', (req, res) => {
  try {
    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id)
    if (!waybill) {
      return res.status(404).json({ message: '运单不存在' })
    }

    const tracks = db.prepare('SELECT * FROM gps_tracks WHERE waybill_id = ? ORDER BY recorded_at DESC LIMIT 1').get(req.params.id)
    const exception = db.prepare('SELECT * FROM exceptions WHERE waybill_id = ? AND status != ? ORDER BY created_at DESC LIMIT 1').get(req.params.id, 'CLOSED')

    waybill.current_location = tracks ? {
      lat: tracks.lat,
      lng: tracks.lng,
      address: tracks.address,
      speed: tracks.speed,
      direction: tracks.direction
    } : null

    waybill.exception = exception

    res.json({ data: waybill })
  } catch (error) {
    res.status(500).json({ message: '获取运单详情失败' })
  }
})

router.post('/:id/status', (req, res) => {
  try {
    const { status } = req.body
    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id)
    if (!waybill) {
      return res.status(404).json({ message: '运单不存在' })
    }

    const statusField = {
      'ACCEPTED': 'accepted_at',
      'PICKED_UP': 'picked_up_at',
      'DEPARTED': 'departed_at',
      'IN_TRANSIT': 'departed_at',
      'ARRIVED': 'arrived_at',
      'SIGNED': 'signed_at',
      'COMPLETED': 'completed_at'
    }

    if (statusField[status]) {
      db.prepare(`UPDATE waybills SET status = ?, ${statusField[status]} = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(status, req.params.id)
    } else {
      db.prepare('UPDATE waybills SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id)
    }

    if (status === 'COMPLETED') {
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('COMPLETED', waybill.order_id)
    }

    const updated = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id)
    res.json({ data: updated })
  } catch (error) {
    res.status(500).json({ message: '更新运单状态失败' })
  }
})

router.post('/:id/accept', (req, res) => {
  try {
    db.prepare('UPDATE waybills SET status = ?, accepted_at = CURRENT_TIMESTAMP WHERE id = ?').run('ACCEPTED', req.params.id)
    db.prepare('UPDATE drivers SET status = ? WHERE id = (SELECT driver_id FROM waybills WHERE id = ?)', 'ON_DUTY', req.params.id)
    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id)
    res.json({ data: waybill })
  } catch (error) {
    res.status(500).json({ message: '接单失败' })
  }
})

router.post('/:id/pickup', (req, res) => {
  try {
    db.prepare('UPDATE waybills SET status = ?, picked_up_at = CURRENT_TIMESTAMP WHERE id = ?').run('PICKED_UP', req.params.id)
    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id)
    res.json({ data: waybill })
  } catch (error) {
    res.status(500).json({ message: '提货确认失败' })
  }
})

router.post('/:id/depart', (req, res) => {
  try {
    db.prepare('UPDATE waybills SET status = ?, departed_at = CURRENT_TIMESTAMP WHERE id = ?').run('DEPARTED', req.params.id)
    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id)
    res.json({ data: waybill })
  } catch (error) {
    res.status(500).json({ message: '出发确认失败' })
  }
})

router.post('/:id/arrive', (req, res) => {
  try {
    db.prepare('UPDATE waybills SET status = ?, arrived_at = CURRENT_TIMESTAMP WHERE id = ?').run('ARRIVED', req.params.id)
    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id)
    res.json({ data: waybill })
  } catch (error) {
    res.status(500).json({ message: '到达确认失败' })
  }
})

router.post('/:id/sign', (req, res) => {
  try {
    const { signed_by, signature_data, photos, remark } = req.body

    db.prepare('UPDATE waybills SET status = ?, signed_at = CURRENT_TIMESTAMP WHERE id = ?').run('SIGNED', req.params.id)

    const receiptId = uuidv4()
    const receiptNo = `RC-${Date.now()}`

    db.prepare(`
      INSERT INTO receipts (id, receipt_no, waybill_id, signed_by, signed_at, photos, remark, status)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, 'UPLOADED')
    `).run(receiptId, receiptNo, req.params.id, signed_by, JSON.stringify(photos || []), remark)

    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id)
    res.json({ data: waybill })
  } catch (error) {
    res.status(500).json({ message: '签收失败' })
  }
})

export default router
