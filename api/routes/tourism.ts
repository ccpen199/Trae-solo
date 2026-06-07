import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/spots', (_req: Request, res: Response): void => {
  try {
    const spots = db.prepare('SELECT * FROM tourist_spots').all()
    res.json({ code: 0, message: 'success', data: spots })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.post('/reservations', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { spot_id, date, visitors, visitor_names } = req.body
    if (!spot_id || !date) {
      res.json({ code: -1, message: '请提供景点ID和日期' })
      return
    }
    const spot = db.prepare('SELECT * FROM tourist_spots WHERE id = ?').get(spot_id) as any
    if (!spot) {
      res.json({ code: -1, message: '景点不存在' })
      return
    }
    const todayCount = db.prepare(
      "SELECT COALESCE(SUM(visitors), 0) as total FROM reservations WHERE spot_id = ? AND date = ? AND status != 'cancelled'"
    ).get(spot_id, date) as { total: number }
    const visitorCount = visitors || 1
    if (todayCount.total + visitorCount > spot.daily_limit) {
      res.json({ code: -1, message: '当日预约人数已达上限' })
      return
    }
    const names = Array.isArray(visitor_names)
      ? visitor_names.map((name: unknown) => String(name || '').trim()).filter(Boolean)
      : []
    const confirmationNo = `NJLY${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`
    const result = db.prepare(
      `INSERT INTO reservations (user_id, spot_id, date, visitors, visitor_names, confirmation_no, status)
       VALUES (?, ?, ?, ?, ?, ?, 'confirmed')`
    ).run(userId, spot_id, date, visitorCount, JSON.stringify(names), confirmationNo)
    res.json({
      code: 0,
      message: 'success',
      data: {
        id: Number(result.lastInsertRowid),
        confirmation_no: confirmationNo,
        status: 'confirmed',
      },
    })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.get('/reservations', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const reservations = (db.prepare(`
      SELECT r.*, s.name as spot_name, s.district, s.description, u.name as user_name
      FROM reservations r
      JOIN tourist_spots s ON r.spot_id = s.id
      JOIN users u ON r.user_id = u.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `).all(userId) as any[]).map((row) => {
      let visitorNames: string[] = []
      try {
        visitorNames = JSON.parse(row.visitor_names || '[]')
      } catch {
        visitorNames = []
      }
      if (visitorNames.length === 0) {
        visitorNames = row.visitors > 1 ? [`${row.user_name || '游客'}等${row.visitors}人`] : [row.user_name || '游客']
      }
      return {
        ...row,
        spot: row.spot_name,
        count: row.visitors,
        visitor_names: visitorNames,
        qr_code: row.confirmation_no || `NJLY${row.id}`,
        can_reschedule: row.status === 'confirmed' && new Date(row.date) > new Date(),
      }
    })
    res.json({ code: 0, message: 'success', data: reservations })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.put('/reservations/:id/reschedule', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { id } = req.params
    const { new_date } = req.body

    if (!new_date) {
      res.json({ code: -1, message: '请提供新的预约日期' })
      return
    }

    const reservation = db.prepare('SELECT * FROM reservations WHERE id = ? AND user_id = ?').get(id, userId) as any
    if (!reservation) {
      res.json({ code: -1, message: '预约记录不存在' })
      return
    }

    if (reservation.status !== 'confirmed') {
      res.json({ code: -1, message: '只有已确认的预约可以改期' })
      return
    }

    if (new Date(reservation.date) <= new Date()) {
      res.json({ code: -1, message: '已过期的预约不能改期' })
      return
    }

    const spot = db.prepare('SELECT * FROM tourist_spots WHERE id = ?').get(reservation.spot_id) as any
    if (!spot) {
      res.json({ code: -1, message: '景点不存在' })
      return
    }

    const todayCount = db.prepare(
      "SELECT COALESCE(SUM(visitors), 0) as total FROM reservations WHERE spot_id = ? AND date = ? AND status != 'cancelled' AND id != ?"
    ).get(reservation.spot_id, new_date, id) as { total: number }

    if (todayCount.total + reservation.visitors > spot.daily_limit) {
      res.json({ code: -1, message: '该日期预约人数已达上限，请选择其他日期' })
      return
    }

    const oldDate = reservation.date
    db.prepare('UPDATE reservations SET date = ?, original_date = ?, rescheduled_count = COALESCE(rescheduled_count, 0) + 1 WHERE id = ?').run(new_date, oldDate, id)

    res.json({
      code: 0,
      message: 'success',
      data: {
        id: Number(id),
        new_date,
        old_date: oldDate,
        status: 'confirmed',
      },
    })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.delete('/reservations/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { id } = req.params

    const reservation = db.prepare('SELECT * FROM reservations WHERE id = ? AND user_id = ?').get(id, userId) as any
    if (!reservation) {
      res.json({ code: -1, message: '预约记录不存在' })
      return
    }

    db.prepare("UPDATE reservations SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP WHERE id = ?").run(id)

    res.json({ code: 0, message: '预约已取消', data: { id: Number(id), status: 'cancelled' } })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

export default router
