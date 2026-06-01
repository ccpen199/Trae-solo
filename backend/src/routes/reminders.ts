import { Router } from 'express'
import db from '../db/index.js'
import { z } from 'zod'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

const reminderSchema = z.object({
  patient_id: z.number(),
  appointment_id: z.number().optional(),
  reminder_date: z.string(),
  reminder_type: z.string(),
  content: z.string()
})

router.get('/', authenticateToken, (req, res) => {
  try {
    const { patient_id, status, date_from, date_to } = req.query

    let query = `
      SELECT r.*, p.name as patient_name, p.phone as patient_phone
      FROM follow_up_reminders r
      LEFT JOIN patients p ON r.patient_id = p.id
      WHERE 1=1
    `
    const params: any[] = []

    if (patient_id) {
      query += ' AND r.patient_id = ?'
      params.push(patient_id)
    }
    if (status) {
      query += ' AND r.status = ?'
      params.push(status)
    }
    if (date_from) {
      query += ' AND r.reminder_date >= ?'
      params.push(date_from)
    }
    if (date_to) {
      query += ' AND r.reminder_date <= ?'
      params.push(date_to)
    }

    query += ' ORDER BY r.reminder_date ASC'
    const reminders = db.prepare(query).all(...params)

    res.json(reminders)
  } catch (error) {
    res.status(500).json({ error: '获取提醒列表失败' })
  }
})

router.post('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const data = reminderSchema.parse(req.body)

    const result = db.prepare(`
      INSERT INTO follow_up_reminders (patient_id, appointment_id, reminder_date, reminder_type, content, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      data.patient_id, data.appointment_id, data.reminder_date,
      data.reminder_type, data.content, req.user?.id
    )

    res.json({ id: result.lastInsertRowid, ...data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    res.status(500).json({ error: '创建提醒失败' })
  }
})

router.post('/:id/send', authenticateToken, (req, res) => {
  try {
    db.prepare(`
      UPDATE follow_up_reminders 
      SET status='sent', sent_at=CURRENT_TIMESTAMP 
      WHERE id=?
    `).run(req.params.id)

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: '标记发送失败' })
  }
})

router.post('/:id/cancel', authenticateToken, (req, res) => {
  try {
    db.prepare(`
      UPDATE follow_up_reminders 
      SET status='cancelled' 
      WHERE id=?
    `).run(req.params.id)

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: '取消提醒失败' })
  }
})

router.delete('/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM follow_up_reminders WHERE id = ?').run(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: '删除提醒失败' })
  }
})

export default router
