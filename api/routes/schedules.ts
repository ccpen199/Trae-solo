import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { auditLog } from '../middleware/audit.js'

const router = Router()

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status, startDate, endDate, page = '1', pageSize = '10',
    } = req.query as any

    const conditions: string[] = []
    const params: any[] = []

    if (status) { conditions.push('s.status = ?'); params.push(status) }
    if (startDate) { conditions.push('s.start_time >= ?'); params.push(startDate) }
    if (endDate) { conditions.push('s.end_time <= ?'); params.push(endDate) }

    if (req.user!.role === 'agent') {
      conditions.push('s.agent_id = ?')
      params.push(req.user!.id)
    } else if (req.user!.role === 'manager') {
      conditions.push('s.agent_id IN (SELECT id FROM users WHERE org_id = ?)')
      params.push(req.user!.org_id)
    }

    const pageNum = Math.max(1, Number(page))
    const pageSizeNum = Math.max(1, Math.min(100, Number(pageSize)))
    const offset = (pageNum - 1) * pageSizeNum
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''

    const totalRow = db.prepare(`SELECT COUNT(*) as count FROM schedules s ${where}`).get(...params) as { count: number }
    const rows = db.prepare(
      `SELECT s.*, h.title as house_title, c.name as client_name, u.name as agent_name
       FROM schedules s
       LEFT JOIN houses h ON s.house_id = h.id
       LEFT JOIN clients c ON s.client_id = c.id
       LEFT JOIN users u ON s.agent_id = u.id
       ${where}
       ORDER BY s.start_time DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSizeNum, offset) as any[]

    res.json({ success: true, data: rows, total: totalRow.count, page: pageNum, pageSize: pageSizeNum })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/recommend/slots', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { houseId, date } = req.query as any
    if (!date) {
      res.status(400).json({ success: false, error: '日期参数为必填项' })
      return
    }

    const dayStart = `${date} 00:00:00`
    const dayEnd = `${date} 23:59:59`

    const existingSchedules = db.prepare(
      `SELECT start_time, end_time FROM schedules
       WHERE agent_id = ? AND status = 'scheduled'
       AND start_time < ? AND end_time > ?`
    ).all(req.user!.id, dayEnd, dayStart) as any[]

    const slots = []
    for (let hour = 8; hour <= 20; hour += 3) {
      const slotStart = `${date} ${String(hour).padStart(2, '0')}:00:00`
      const slotEnd = `${date} ${String(Math.min(hour + 3, 23)).padStart(2, '0')}:00:00`

      const hasConflict = existingSchedules.some(s => {
        const sStart = new Date(s.start_time).getTime()
        const sEnd = new Date(s.end_time).getTime()
        const slotStartMs = new Date(slotStart).getTime()
        const slotEndMs = new Date(slotEnd).getTime()
        return sStart < slotEndMs && sEnd > slotStartMs
      })

      slots.push({
        start: slotStart,
        end: slotEnd,
        available: !hasConflict,
      })
    }

    res.json({ success: true, data: slots })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', authenticate, auditLog('create', 'schedule'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { houseId, clientId, startTime, endTime, remark } = req.body

    if (!houseId || !clientId || !startTime || !endTime) {
      res.status(400).json({ success: false, error: '房源、客户、开始时间和结束时间为必填项' })
      return
    }

    const conflict = db.prepare(
      `SELECT id FROM schedules
       WHERE agent_id = ? AND status = 'scheduled'
       AND start_time < ? AND end_time > ?`
    ).get(req.user!.id, endTime, startTime) as any

    if (conflict) {
      res.status(409).json({ success: false, error: '该时间段存在日程冲突' })
      return
    }

    const result = db.prepare(
      `INSERT INTO schedules (agent_id, house_id, client_id, start_time, end_time, remark)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(req.user!.id, houseId, clientId, startTime, endTime, remark || null)

    const schedule = db.prepare(
      `SELECT s.*, h.title as house_title, c.name as client_name
       FROM schedules s
       LEFT JOIN houses h ON s.house_id = h.id
       LEFT JOIN clients c ON s.client_id = c.id
       WHERE s.id = ?`
    ).get(result.lastInsertRowid) as any

    res.status(201).json({ success: true, data: schedule })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id', authenticate, auditLog('update', 'schedule'), async (req: Request, res: Response): Promise<void> => {
  try {
    const scheduleId = Number(req.params.id)
    const schedule = db.prepare('SELECT agent_id FROM schedules WHERE id = ?').get(scheduleId) as any
    if (!schedule) {
      res.status(404).json({ success: false, error: '日程不存在' })
      return
    }

    if (schedule.agent_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '只能修改自己的日程' })
      return
    }

    const { startTime, endTime, remark, houseId, clientId } = req.body

    if (startTime && endTime) {
      const conflict = db.prepare(
        `SELECT id FROM schedules
         WHERE agent_id = ? AND status = 'scheduled' AND id != ?
         AND start_time < ? AND end_time > ?`
      ).get(req.user!.id, scheduleId, endTime, startTime) as any

      if (conflict) {
        res.status(409).json({ success: false, error: '该时间段存在日程冲突' })
        return
      }
    }

    const fields: string[] = []
    const params: any[] = []
    const allowedFields: Record<string, string> = {
      houseId: 'house_id', clientId: 'client_id',
      startTime: 'start_time', endTime: 'end_time', remark: 'remark',
    }

    for (const [bodyKey, colKey] of Object.entries(allowedFields)) {
      if (req.body[bodyKey] !== undefined) {
        fields.push(`${colKey} = ?`)
        params.push(req.body[bodyKey])
      }
    }

    if (fields.length === 0) {
      res.status(400).json({ success: false, error: '没有需要更新的字段' })
      return
    }

    params.push(scheduleId)
    db.prepare(`UPDATE schedules SET ${fields.join(', ')} WHERE id = ?`).run(...params)

    const updated = db.prepare(
      `SELECT s.*, h.title as house_title, c.name as client_name
       FROM schedules s
       LEFT JOIN houses h ON s.house_id = h.id
       LEFT JOIN clients c ON s.client_id = c.id
       WHERE s.id = ?`
    ).get(scheduleId) as any

    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/:id', authenticate, auditLog('cancel', 'schedule'), async (req: Request, res: Response): Promise<void> => {
  try {
    const scheduleId = Number(req.params.id)
    const schedule = db.prepare('SELECT agent_id FROM schedules WHERE id = ?').get(scheduleId) as any
    if (!schedule) {
      res.status(404).json({ success: false, error: '日程不存在' })
      return
    }

    const isOwner = schedule.agent_id === req.user!.id
    const isPrivileged = ['director', 'manager'].includes(req.user!.role)
    if (!isOwner && !isPrivileged) {
      res.status(403).json({ success: false, error: '无权取消此日程' })
      return
    }

    db.prepare("UPDATE schedules SET status = 'cancelled' WHERE id = ?").run(scheduleId)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id/complete', authenticate, auditLog('complete', 'schedule'), async (req: Request, res: Response): Promise<void> => {
  try {
    const scheduleId = Number(req.params.id)
    const schedule = db.prepare('SELECT agent_id FROM schedules WHERE id = ?').get(scheduleId) as any
    if (!schedule) {
      res.status(404).json({ success: false, error: '日程不存在' })
      return
    }

    if (schedule.agent_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '只能完成自己的日程' })
      return
    }

    db.prepare("UPDATE schedules SET status = 'completed' WHERE id = ?").run(scheduleId)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
