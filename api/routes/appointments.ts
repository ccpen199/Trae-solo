import { Router, type Request, type Response, type NextFunction } from 'express'
import db from '../db/index.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

function generateAppointmentNo() {
  const year = new Date().getFullYear()
  const count = db.prepare("SELECT COUNT(*) as count FROM service_appointments WHERE appointment_no LIKE ?").get(`APT-${year}-%`) as { count: number }
  return `APT-${year}-${String(count.count + 1).padStart(4, '0')}`
}

router.get('/providers', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { provider_type, city } = req.query
    
    let query = 'SELECT * FROM service_providers WHERE is_active = 1'
    const params: any[] = []
    
    if (provider_type) {
      query += ' AND provider_type = ?'
      params.push(provider_type)
    }
    if (city) {
      query += ' AND service_areas LIKE ?'
      params.push(`%${city}%`)
    }
    
    query += ' ORDER BY rating DESC'
    
    const providers = db.prepare(query).all(...params)
    
    res.json({
      success: true,
      data: providers
    })
  } catch (e) {
    next(e)
  }
})

router.get('/providers/:id/slots', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query
    const providerId = req.params.id
    
    const existingAppointments = db.prepare(`
      SELECT appointment_date, appointment_time, duration
      FROM service_appointments
      WHERE provider_id = ? AND appointment_date = ? AND status != 'cancelled'
    `).all(providerId, date)
    
    const bookedSlots = existingAppointments.map((apt: any) => `${apt.appointment_date} ${apt.appointment_time}`)
    
    const timeSlots = []
    for (let hour = 9; hour < 17; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
        const slotKey = `${date} ${time}`
        if (!bookedSlots.includes(slotKey)) {
          timeSlots.push({
            time,
            available: !bookedSlots.includes(slotKey)
          })
        }
      }
    }
    
    res.json({
      success: true,
      data: timeSlots
    })
  } catch (e) {
    next(e)
  }
})

router.get('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, pageSize = 20, status, property_id, owner_id, provider_id, date } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    
    let query = `
      SELECT a.*, p.title as property_title,
             o.full_name_en as owner_name_en, o.full_name_zh as owner_name_zh,
             sp.full_name as provider_name, sp.provider_type, sp.phone as provider_phone, sp.email as provider_email
      FROM service_appointments a
      JOIN properties p ON a.property_id = p.id
      JOIN owners o ON a.owner_id = o.id
      JOIN service_providers sp ON a.provider_id = sp.id
      WHERE 1=1
    `
    const params: any[] = []
    
    if (status) {
      query += ' AND a.status = ?'
      params.push(status)
    }
    if (property_id) {
      query += ' AND a.property_id = ?'
      params.push(property_id)
    }
    if (owner_id) {
      query += ' AND a.owner_id = ?'
      params.push(owner_id)
    }
    if (provider_id) {
      query += ' AND a.provider_id = ?'
      params.push(provider_id)
    }
    if (date) {
      query += ' AND a.appointment_date = ?'
      params.push(date)
    }
    
    const countQuery = query.replace(/SELECT a\.[^FROM]+/, 'SELECT COUNT(*) as count')
    const total = (db.prepare(countQuery).get(...params) as { count: number }).count
    
    query += ' ORDER BY a.appointment_date ASC, a.appointment_time ASC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), offset)
    
    const appointments = db.prepare(query).all(...params)
    
    res.json({
      success: true,
      data: appointments,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    })
  } catch (e) {
    next(e)
  }
})

router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const appointment = db.prepare(`
      SELECT a.*, p.title as property_title, p.address_en,
             o.full_name_en as owner_name_en, o.full_name_zh as owner_name_zh, o.email as owner_email, o.phone as owner_phone,
             sp.*
      FROM service_appointments a
      JOIN properties p ON a.property_id = p.id
      JOIN owners o ON a.owner_id = o.id
      JOIN service_providers sp ON a.provider_id = sp.id
      WHERE a.id = ?
    `).get(req.params.id)
    
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' })
    }
    
    res.json({ success: true, data: appointment })
  } catch (e) {
    next(e)
  }
})

router.post('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = req.body
    const appointment_no = data.appointment_no || generateAppointmentNo()
    
    const result = db.prepare(`
      INSERT INTO service_appointments (
        appointment_no, property_id, owner_id, provider_id, service_type,
        appointment_date, appointment_time, duration, status, notes, meeting_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      appointment_no, data.property_id, data.owner_id, data.provider_id, data.service_type,
      data.appointment_date, data.appointment_time, data.duration || 60,
      data.status || 'pending', data.notes, data.meeting_link
    )
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
      VALUES (?, 'create', 'appointment', ?, ?)
    `).run(req.user!.id, result.lastInsertRowid, JSON.stringify({ ...data, appointment_no }))
    
    res.status(201).json({
      success: true,
      data: { id: result.lastInsertRowid, appointment_no, ...data }
    })
  } catch (e) {
    next(e)
  }
})

router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = db.prepare('SELECT * FROM service_appointments WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Appointment not found' })
    }
    
    const data = req.body
    
    db.prepare(`
      UPDATE service_appointments SET
        property_id = ?, owner_id = ?, provider_id = ?, service_type = ?,
        appointment_date = ?, appointment_time = ?, duration = ?, status = ?,
        notes = ?, meeting_link = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.property_id ?? (existing as any).property_id,
      data.owner_id ?? (existing as any).owner_id,
      data.provider_id ?? (existing as any).provider_id,
      data.service_type ?? (existing as any).service_type,
      data.appointment_date ?? (existing as any).appointment_date,
      data.appointment_time ?? (existing as any).appointment_time,
      data.duration ?? (existing as any).duration,
      data.status ?? (existing as any).status,
      data.notes ?? (existing as any).notes,
      data.meeting_link ?? (existing as any).meeting_link,
      req.params.id
    )
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
      VALUES (?, 'update', 'appointment', ?, ?, ?)
    `).run(req.user!.id, req.params.id, JSON.stringify(existing), JSON.stringify(data))
    
    res.json({ success: true, message: 'Appointment updated successfully' })
  } catch (e) {
    next(e)
  }
})

router.delete('/:id/cancel', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = db.prepare('SELECT * FROM service_appointments WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Appointment not found' })
    }
    
    db.prepare(`
      UPDATE service_appointments SET
        status = 'cancelled', cancelled_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.body.reason || 'Cancelled by user', req.params.id)
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
      VALUES (?, 'cancel', 'appointment', ?, ?, ?)
    `).run(req.user!.id, req.params.id, JSON.stringify(existing), JSON.stringify({ status: 'cancelled', reason: req.body.reason }))
    
    res.json({ success: true, message: 'Appointment cancelled successfully' })
  } catch (e) {
    next(e)
  }
})

export default router
