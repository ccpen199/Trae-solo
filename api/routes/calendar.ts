import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../database.js'
import { authenticateToken } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import type { HealthCalendarEvent } from '@shared/types'

const router = Router()

function rowToEvent(row: any): HealthCalendarEvent {
  return {
    id: row.id,
    ownerId: row.owner_id,
    petId: row.pet_id,
    type: row.type,
    title: row.title,
    date: row.date,
    reminderDays: row.reminder_days,
    completed: row.completed === 1,
    relatedId: row.related_id,
  }
}

router.get('/events', authenticateToken, requireRole('owner'), async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const { petId, startDate, endDate, completed } = req.query as any

    let sql = 'SELECT * FROM health_calendar_events WHERE owner_id = ?'
    const params: any[] = [req.user!.id]

    if (petId) {
      sql += ' AND pet_id = ?'
      params.push(petId)
    }

    if (startDate) {
      sql += ' AND date >= ?'
      params.push(startDate)
    }

    if (endDate) {
      sql += ' AND date <= ?'
      params.push(endDate)
    }

    if (completed !== undefined) {
      sql += ' AND completed = ?'
      params.push(completed === 'true' ? 1 : 0)
    }

    sql += ' ORDER BY date ASC'

    const rows = db.prepare(sql).all(...params) as any[]
    const events = rows.map(rowToEvent)

    res.json({
      success: true,
      data: events,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取日历事件失败',
    })
  }
})

router.post('/events', authenticateToken, requireRole('owner'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { petId, type, title, date, reminderDays, relatedId } = req.body
    const db = getDatabase()

    if (!petId || !type || !title || !date) {
      res.status(400).json({
        success: false,
        error: '宠物ID、类型、标题和日期不能为空',
      })
      return
    }

    const id = uuidv4()
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ')

    db.prepare(
      'INSERT INTO health_calendar_events (id, owner_id, pet_id, type, title, date, reminder_days, completed, related_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)'
    ).run(
      id,
      req.user!.id,
      petId,
      type,
      title,
      date,
      reminderDays || 3,
      relatedId || null,
      createdAt
    )

    const row = db.prepare('SELECT * FROM health_calendar_events WHERE id = ?').get(id) as any
    const event = rowToEvent(row)

    res.json({
      success: true,
      data: event,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '创建日历事件失败',
    })
  }
})

router.put('/events/:id/complete', authenticateToken, requireRole('owner'), async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const event = db.prepare('SELECT * FROM health_calendar_events WHERE id = ? AND owner_id = ?').get(req.params.id, req.user!.id) as any

    if (!event) {
      res.status(404).json({
        success: false,
        error: '日历事件不存在或无权访问',
      })
      return
    }

    const { completed } = req.body
    const completedValue = completed !== undefined ? (completed ? 1 : 0) : 1

    db.prepare('UPDATE health_calendar_events SET completed = ? WHERE id = ?').run(completedValue, event.id)

    const row = db.prepare('SELECT * FROM health_calendar_events WHERE id = ?').get(event.id) as any
    const updatedEvent = rowToEvent(row)

    res.json({
      success: true,
      data: updatedEvent,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '更新日历事件失败',
    })
  }
})

export default router
