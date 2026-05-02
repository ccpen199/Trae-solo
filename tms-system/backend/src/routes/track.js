import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../models/database.js'

const router = express.Router()

router.get('/:waybillId', (req, res) => {
  try {
    const tracks = db.prepare('SELECT * FROM gps_tracks WHERE waybill_id = ? ORDER BY recorded_at ASC').all(req.params.waybillId)
    res.json({ data: tracks })
  } catch (error) {
    res.status(500).json({ message: '获取轨迹失败' })
  }
})

router.get('/:waybillId/replay', (req, res) => {
  try {
    const tracks = db.prepare('SELECT * FROM gps_tracks WHERE waybill_id = ? ORDER BY recorded_at ASC').all(req.params.waybillId)

    const replayData = tracks.map(t => ({
      lat: t.lat,
      lng: t.lng,
      address: t.address,
      speed: t.speed,
      time: t.recorded_at
    }))

    res.json({ data: replayData })
  } catch (error) {
    res.status(500).json({ message: '获取轨迹回放失败' })
  }
})

router.get('/exceptions', (req, res) => {
  try {
    const { status } = req.query
    let whereClause = '1=1'
    const params = []

    if (status) {
      whereClause += ' AND status = ?'
      params.push(status)
    }

    const exceptions = db.prepare(`SELECT * FROM exceptions WHERE ${whereClause} ORDER BY created_at DESC`).all(...params)
    res.json({ data: exceptions })
  } catch (error) {
    res.status(500).json({ message: '获取异常列表失败' })
  }
})

router.post('/exceptions', (req, res) => {
  try {
    const id = uuidv4()
    const exceptionNo = `EXP-${Date.now()}`

    const { waybill_id, type, description, report_lat, report_lng, report_address, report_by, images } = req.body

    db.prepare(`
      INSERT INTO exceptions (id, waybill_id, exception_no, type, description, report_lat, report_lng, report_address, report_by, images, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REPORTED')
    `).run(id, waybill_id, exceptionNo, type, description, report_lat, report_lng, report_address, report_by, JSON.stringify(images || []))

    const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(id)
    res.json({ data: exception })
  } catch (error) {
    res.status(500).json({ message: '创建异常失败' })
  }
})

router.put('/exceptions/:id', (req, res) => {
  try {
    const { status, handling_result, handled_by } = req.body

    db.prepare(`
      UPDATE exceptions SET status = ?, handling_result = ?, handled_by = ?, handled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, handling_result, handled_by, req.params.id)

    const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(req.params.id)
    res.json({ data: exception })
  } catch (error) {
    res.status(500).json({ message: '更新异常失败' })
  }
})

export default router
