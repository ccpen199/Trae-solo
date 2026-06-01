import { Router } from 'express'
import db from '../db/index.js'
import { z } from 'zod'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

const appointmentSchema = z.object({
  patient_id: z.number().min(1, '患者不能为空'),
  doctor_id: z.number().min(1, '医生不能为空'),
  chair_id: z.number().min(1, '椅位不能为空'),
  treatment_id: z.number().optional(),
  appointment_date: z.string().min(1, '预约日期不能为空'),
  start_time: z.string().min(1, '开始时间不能为空'),
  end_time: z.string().min(1, '结束时间不能为空'),
  notes: z.string().optional()
})

function checkConflict(doctorId: number, chairId: number, date: string, startTime: string, endTime: string, excludeId?: number): boolean {
  let query = `
    SELECT COUNT(*) as count FROM appointments 
    WHERE appointment_date = ? 
    AND status IN ('scheduled', 'confirmed')
    AND (
      (doctor_id = ? AND start_time < ? AND end_time > ?)
      OR (chair_id = ? AND start_time < ? AND end_time > ?)
    )
  `
  const params: any[] = [date, doctorId, endTime, startTime, chairId, endTime, startTime]

  if (excludeId) {
    query += ' AND id != ?'
    params.push(excludeId)
  }

  const result = db.prepare(query).get(...params) as { count: number }
  return result.count > 0
}

function getMissedCount(patientId: number): number {
  const result = db.prepare(`
    SELECT SUM(missed_count) as total FROM appointments 
    WHERE patient_id = ? AND status = 'missed'
  `).get(patientId) as { total: number }
  return result.total || 0
}

router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { date, doctor_id, status, page = 1, pageSize = 50 } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)

    let query = `
      SELECT a.*, p.name as patient_name, p.phone as patient_phone,
             u.name as doctor_name, c.name as chair_name,
             t.name as treatment_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users u ON a.doctor_id = u.id
      LEFT JOIN chairs c ON a.chair_id = c.id
      LEFT JOIN treatments t ON a.treatment_id = t.id
      WHERE 1=1
    `
    const params: any[] = []

    if (date) {
      query += ' AND a.appointment_date = ?'
      params.push(date)
    }
    if (doctor_id) {
      query += ' AND a.doctor_id = ?'
      params.push(doctor_id)
    }
    if (status) {
      query += ' AND a.status = ?'
      params.push(status)
    }

    query += ' ORDER BY a.appointment_date DESC, a.start_time ASC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), offset)

    const appointments = db.prepare(query).all(...params)

    let countQuery = 'SELECT COUNT(*) as count FROM appointments WHERE 1=1'
    const countParams: any[] = []
    if (date) { countQuery += ' AND appointment_date = ?'; countParams.push(date) }
    if (doctor_id) { countQuery += ' AND doctor_id = ?'; countParams.push(doctor_id) }
    if (status) { countQuery += ' AND status = ?'; countParams.push(status) }

    const total = db.prepare(countQuery).get(...countParams) as { count: number }

    res.json({
      list: appointments,
      total: total.count,
      page: Number(page),
      pageSize: Number(pageSize)
    })
  } catch (error) {
    res.status(500).json({ error: '获取预约列表失败' })
  }
})

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const appointment = db.prepare(`
      SELECT a.*, p.name as patient_name, p.phone as patient_phone,
             u.name as doctor_name, c.name as chair_name,
             t.name as treatment_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users u ON a.doctor_id = u.id
      LEFT JOIN chairs c ON a.chair_id = c.id
      LEFT JOIN treatments t ON a.treatment_id = t.id
      WHERE a.id = ?
    `).get(req.params.id)

    if (!appointment) {
      return res.status(404).json({ error: '预约不存在' })
    }

    res.json(appointment)
  } catch (error) {
    res.status(500).json({ error: '获取预约详情失败' })
  }
})

router.post('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const data = appointmentSchema.parse(req.body)

    const missedCount = getMissedCount(data.patient_id)
    if (missedCount >= 3) {
      return res.status(400).json({ error: '患者爽约次数过多，需先到现场确认后再预约' })
    }

    if (checkConflict(data.doctor_id, data.chair_id, data.appointment_date, data.start_time, data.end_time)) {
      return res.status(400).json({ error: '该时间段医生或椅位已被预约' })
    }

    const result = db.prepare(`
      INSERT INTO appointments (patient_id, doctor_id, chair_id, treatment_id, appointment_date, start_time, end_time, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.patient_id, data.doctor_id, data.chair_id, data.treatment_id,
      data.appointment_date, data.start_time, data.end_time, data.notes, req.user?.id
    )

    res.json({ id: result.lastInsertRowid, ...data, missed_warning: missedCount > 0 ? `患者已有${missedCount}次爽约记录` : null })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    res.status(500).json({ error: '创建预约失败' })
  }
})

router.put('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const data = appointmentSchema.parse(req.body)
    const id = Number(req.params.id)

    const existing = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id) as any
    if (!existing) {
      return res.status(404).json({ error: '预约不存在' })
    }

    if (checkConflict(data.doctor_id, data.chair_id, data.appointment_date, data.start_time, data.end_time, id)) {
      return res.status(400).json({ error: '该时间段医生或椅位已被预约' })
    }

    const isReschedule = existing.appointment_date !== data.appointment_date || 
                         existing.start_time !== data.start_time || 
                         existing.end_time !== data.end_time

    const query = isReschedule
      ? `UPDATE appointments SET patient_id=?, doctor_id=?, chair_id=?, treatment_id=?, appointment_date=?, start_time=?, end_time=?, notes=?, reschedule_reason=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
      : `UPDATE appointments SET patient_id=?, doctor_id=?, chair_id=?, treatment_id=?, appointment_date=?, start_time=?, end_time=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`

    const params = isReschedule
      ? [data.patient_id, data.doctor_id, data.chair_id, data.treatment_id, data.appointment_date, data.start_time, data.end_time, data.notes, req.body.reschedule_reason || '改期', id]
      : [data.patient_id, data.doctor_id, data.chair_id, data.treatment_id, data.appointment_date, data.start_time, data.end_time, data.notes, id]

    db.prepare(query).run(...params)

    res.json({ success: true, id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    res.status(500).json({ error: '更新预约失败' })
  }
})

router.post('/:id/cancel', authenticateToken, (req, res) => {
  try {
    const { reason } = req.body
    const id = Number(req.params.id)

    db.prepare(`
      UPDATE appointments 
      SET status='cancelled', cancel_reason=?, updated_at=CURRENT_TIMESTAMP 
      WHERE id=?
    `).run(reason || '用户取消', id)

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: '取消预约失败' })
  }
})

router.post('/:id/status', authenticateToken, (req, res) => {
  try {
    const { status } = req.body
    const id = Number(req.params.id)

    db.prepare(`
      UPDATE appointments SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
    `).run(status, id)

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: '更新状态失败' })
  }
})

router.get('/check/conflict', authenticateToken, (req, res) => {
  try {
    const { doctor_id, chair_id, date, start_time, end_time } = req.query
    const conflict = checkConflict(
      Number(doctor_id),
      Number(chair_id),
      date as string,
      start_time as string,
      end_time as string
    )
    res.json({ conflict })
  } catch (error) {
    res.status(500).json({ error: '检查冲突失败' })
  }
})

export default router
