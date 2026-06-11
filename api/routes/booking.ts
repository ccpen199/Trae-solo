import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/available-slots', (req: Request, res: Response): void => {
  const { date, area } = req.query

  if (!date) {
    res.status(400).json({ success: false, error: '请提供日期参数' })
    return
  }

  const targetDate = new Date(date as string)
  const slots = []
  const startHour = 8

  for (let h = startHour; h < startHour + 8; h++) {
    for (const offset of [0, 30]) {
      const startTime = new Date(targetDate)
      startTime.setHours(h, offset, 0, 0)
      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + 30)

      const available = Math.random() > 0.3
      slots.push({
        slotId: `SLOT_${date}_${h}_${offset}`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        available,
        technicianCount: available ? Math.floor(Math.random() * 5) + 1 : 0,
      })
    }
  }

  const technicians = (db.prepare(`SELECT tp.*, u.name, u.avatar FROM technician_profiles tp JOIN users u ON tp.user_id = u.id WHERE tp.status = 'approved'`).all() as any[])
    .map((tp) => ({
      techId: tp.user_id,
      name: tp.name,
      lat: tp.lat + (Math.random() - 0.5) * 0.02,
      lng: tp.lng + (Math.random() - 0.5) * 0.02,
      skills: JSON.parse(tp.skills || '[]'),
      rating: tp.rating,
    }))

  res.json({
    success: true,
    data: { slots, technicians },
  })
})

router.post('/create', (req: Request, res: Response): void => {
  const { diagnosisId, deviceType, address, slotId, description, consumerId } = req.body

  if (!deviceType || !address || !slotId) {
    res.status(400).json({ success: false, error: '请提供设备类型、地址和时段' })
    return
  }

  const userId = consumerId || 'U001'
  const orderId = `ORD${Date.now()}`
  const now = new Date().toISOString()
  const bookedAt = new Date(slotId.replace('SLOT_', '').replace(/_(\d+)_(\d+)/, 'T$1:$2:00')).toISOString()

  const device = db.prepare("SELECT * FROM devices WHERE type = ? OR id = ?").get(deviceType, deviceType) as any
  const deviceId = device ? device.id : null

  db.prepare('INSERT INTO orders (id, consumer_id, device_id, status, total_price, address, booked_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    orderId, userId, deviceId, 'pending', 0, address, bookedAt, now,
  )

  db.prepare('INSERT INTO timeline_events (id, order_id, status, operator_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    `TL${Date.now()}`, orderId, 'pending', userId, description || '用户提交维修工单', now,
  )

  const countdown = 3600

  res.status(201).json({
    success: true,
    data: { orderId, countdown },
  })
})

export default router
