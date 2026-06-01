import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/vessels', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const vessels = db.prepare(`
      SELECT v.*, tp.latitude, tp.longitude, tp.speed, tp.heading, tp.recorded_at
      FROM vessels v
      LEFT JOIN track_points tp ON tp.vessel_id = v.id
        AND tp.id = (SELECT tp2.id FROM track_points tp2 WHERE tp2.vessel_id = v.id ORDER BY tp2.recorded_at DESC LIMIT 1)
      WHERE v.status = '在航'
      ORDER BY v.id
    `).all()
    res.json({ success: true, data: vessels })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/vessels/:id/track', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { start, end } = req.query

    let where = 'WHERE vessel_id = ?'
    const params: any[] = [req.params.id]

    if (start && end) {
      where += ' AND recorded_at BETWEEN ? AND ?'
      params.push(start, end)
    } else {
      where += " AND recorded_at >= datetime('now','localtime','-24 hours')"
    }

    const points = db.prepare(`SELECT * FROM track_points ${where} ORDER BY recorded_at ASC`).all(...params)
    res.json({ success: true, data: points })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/fences', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const fences = db.prepare('SELECT * FROM fences ORDER BY id DESC').all()
    res.json({ success: true, data: fences })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/fences', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { name, fence_type, coordinates, status } = req.body
    if (!name || !fence_type || !coordinates) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }
    const coordsStr = typeof coordinates === 'string' ? coordinates : JSON.stringify(coordinates)
    const result = db.prepare(`
      INSERT INTO fences (name, fence_type, coordinates, status) VALUES (?, ?, ?, ?)
    `).run(name, fence_type, coordsStr, status || '启用')
    res.json({ success: true, data: { id: Number(result.lastInsertRowid) } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/alerts', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { status = '' } = req.query

    let where = 'WHERE 1=1'
    const params: any[] = []

    if (status) {
      where += ' AND a.status = ?'
      params.push(status)
    }

    const alerts = db.prepare(`
      SELECT a.*, v.name AS vessel_name, v.code AS vessel_code, f.name AS fence_name
      FROM alerts a
      JOIN vessels v ON v.id = a.vessel_id
      LEFT JOIN fences f ON f.id = a.fence_id
      ${where} ORDER BY a.triggered_at DESC
    `).all(...params)
    res.json({ success: true, data: alerts })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/alerts/:id/handle', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id) as any
    if (!alert) {
      res.status(404).json({ success: false, error: '预警不存在' })
      return
    }
    db.prepare(`
      UPDATE alerts SET status='已处理', resolved_at=datetime('now','localtime') WHERE id=?
    `).run(req.params.id)

    const existingEvent = db.prepare('SELECT id FROM events WHERE vessel_id = ? AND title LIKE ?').get(
      alert.vessel_id,
      `%${alert.message}%`
    )

    let eventId
    if (!existingEvent) {
      const eventTypeMap: Record<string, string> = {
        '越界': '越界',
        '禁渔区靠近': '违规作业',
        '超时未返': '违规作业',
        '设备离线': '失联',
      }
      const eventType = eventTypeMap[alert.alert_type] || '违规作业'
      const result = db.prepare(`
        INSERT INTO events (vessel_id, event_type, title, description, status, created_by)
        VALUES (?, ?, ?, ?, '待处置', '系统')
      `).run(
        alert.vessel_id,
        eventType,
        `${alert.alert_type}告警处置`,
        `告警类型: ${alert.alert_type}\n告警信息: ${alert.message}\n触发时间: ${alert.triggered_at}\n严重程度: ${alert.severity}`,
      )
      eventId = Number(result.lastInsertRowid)

      db.prepare(`
        INSERT INTO event_notifications (event_id, recipient, method, content)
        VALUES (?, ?, '系统', ?)
      `).run(
        eventId,
        `${alert.alert_type}告警自动通知`,
        `渔船${alert.message}，请立即处理。严重程度：${alert.severity}`,
      )
    } else {
      eventId = (existingEvent as any).id
    }

    res.json({ success: true, message: '处理成功', data: { event_id: eventId } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
