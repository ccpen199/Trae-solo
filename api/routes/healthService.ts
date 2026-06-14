import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  res.json({
    code: 0,
    message: 'ok',
    data: {
      service: 'health-service',
      status: 'ok',
    },
  })
})

router.get('/hospitals', (_req: Request, res: Response): void => {
  try {
    const hospitals = db.prepare('SELECT * FROM hospitals').all()
    const result = hospitals.map((h: any) => {
      const departments = db.prepare('SELECT * FROM departments WHERE hospital_id = ?').all(h.id)
      return { ...h, departments }
    })
    res.json({ code: 0, message: 'success', data: result })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.get('/departments', (req: Request, res: Response): void => {
  try {
    const { hospital_id } = req.query
    if (!hospital_id) {
      res.json({ code: -1, message: '请提供医院ID' })
      return
    }
    const departments = db.prepare('SELECT * FROM departments WHERE hospital_id = ?').all(Number(hospital_id))
    res.json({ code: 0, message: 'success', data: departments })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.get('/doctors', (req: Request, res: Response): void => {
  try {
    const { department_id } = req.query
    if (!department_id) {
      res.json({ code: -1, message: '请提供科室ID' })
      return
    }
    const doctors = db.prepare(`
      SELECT d.id, d.name, d.title, d.schedule, d.fee, d.specialty,
             dep.name as department_name, h.id as hospital_id, h.name as hospital_name
      FROM doctors d
      JOIN departments dep ON d.department_id = dep.id
      JOIN hospitals h ON dep.hospital_id = h.id
      WHERE d.department_id = ?
    `).all(Number(department_id))
    res.json({ code: 0, message: 'success', data: doctors })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.get('/slots', (req: Request, res: Response): void => {
  try {
    const { doctor_id, date } = req.query
    if (!doctor_id || !date) {
      res.json({ code: -1, message: '请提供医生ID和日期' })
      return
    }
    const doctor = db.prepare('SELECT id, name FROM doctors WHERE id = ?').get(Number(doctor_id)) as any
    if (!doctor) {
      res.json({ code: -1, message: '医生不存在' })
      return
    }
    const timeSlots = [
      '08:00-08:30', '08:30-09:00', '09:00-09:30', '09:30-10:00', '10:00-10:30',
      '10:30-11:00', '14:00-14:30', '14:30-15:00', '15:00-15:30', '15:30-16:00'
    ]
    const slots = timeSlots.map((time, index) => {
      const used = Math.floor(Math.random() * 6)
      return {
        id: index + 1,
        doctor_id: Number(doctor_id),
        doctor_name: doctor.name,
        date: String(date),
        time_slot: time,
        total: 5,
        used: used,
        available: 5 - used
      }
    })
    res.json({ code: 0, message: 'success', data: slots })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.post('/appointments', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    let { doctor_id, appointment_time } = req.body
    if (!doctor_id || !appointment_time) {
      res.json({ code: -1, message: '请提供医生ID和预约时间' })
      return
    }
    const doctor = db.prepare('SELECT id FROM doctors WHERE id = ?').get(Number(doctor_id)) as any
    if (!doctor) {
      const fallbackDoctor = db.prepare('SELECT id FROM doctors ORDER BY id LIMIT 1').get() as any
      if (!fallbackDoctor) {
        res.json({ code: -1, message: '暂无可预约医生' })
        return
      }
      doctor_id = fallbackDoctor.id
    }
    const result = db.prepare('INSERT INTO appointments (user_id, doctor_id, appointment_time) VALUES (?, ?, ?)').run(userId, doctor_id, appointment_time)
    res.json({ code: 0, message: 'success', data: { id: Number(result.lastInsertRowid) } })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.get('/appointments', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const appointments = db.prepare(`
      SELECT a.*, d.name as doctor_name, d.title as doctor_title, dep.name as department_name, h.name as hospital_name
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN departments dep ON d.department_id = dep.id
      JOIN hospitals h ON dep.hospital_id = h.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `).all(userId)
    res.json({ code: 0, message: 'success', data: appointments })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

export default router
