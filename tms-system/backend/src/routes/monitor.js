import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../models/database.js'

const router = express.Router()

router.get('/waybills', (req, res) => {
  try {
    const waybills = db.prepare(`
      SELECT w.*, o.goods_name, o.weight
      FROM waybills w
      LEFT JOIN orders o ON w.order_id = o.id
      WHERE w.status IN ('ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED')
    `).all()

    const result = waybills.map(w => {
      const latestTrack = db.prepare('SELECT * FROM gps_tracks WHERE waybill_id = ? ORDER BY recorded_at DESC LIMIT 1').get(w.id)
      const exception = db.prepare("SELECT * FROM exceptions WHERE waybill_id = ? AND status NOT IN ('RESOLVED', 'CLOSED') LIMIT 1").get(w.id)

      return {
        ...w,
        current_location: latestTrack ? {
          lat: latestTrack.lat,
          lng: latestTrack.lng,
          address: latestTrack.address,
          speed: latestTrack.speed
        } : null,
        has_exception: !!exception,
        exception: exception
      }
    })

    const inTransitCount = db.prepare("SELECT COUNT(*) as count FROM waybills WHERE status = 'IN_TRANSIT'").get().count
    const completedToday = db.prepare("SELECT COUNT(*) as count FROM waybills WHERE date(completed_at) = date('now')").get().count
    const exceptionCount = db.prepare("SELECT COUNT(*) as count FROM exceptions WHERE status NOT IN ('RESOLVED', 'CLOSED')").get().count

    res.json({
      data: {
        waybills: result,
        stats: {
          inTransitCount,
          completedToday,
          exceptionCount
        }
      }
    })
  } catch (error) {
    res.status(500).json({ message: '获取监控数据失败' })
  }
})

router.get('/waybills/:id', (req, res) => {
  try {
    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id)
    if (!waybill) {
      return res.status(404).json({ message: '运单不存在' })
    }

    const latestTrack = db.prepare('SELECT * FROM gps_tracks WHERE waybill_id = ? ORDER BY recorded_at DESC LIMIT 1').get(req.params.id)

    res.json({
      data: {
        waybill,
        current_location: latestTrack || null
      }
    })
  } catch (error) {
    res.status(500).json({ message: '获取运单位置失败' })
  }
})

export default router
