import express from 'express'
import db from '../db.js'

const router = express.Router()

function checkTimeConflict(hallId: number, bookingDate: string, startTime: string, endTime: string, excludeId?: number) {
  let sql = `
    SELECT b.*, h.name as hall_name 
    FROM bookings b
    JOIN banquet_halls h ON b.hall_id = h.id
    WHERE b.hall_id = ? 
      AND b.booking_date = ?
      AND b.status != 'cancelled'
  `
  const params: any[] = [hallId, bookingDate]
  
  if (excludeId) {
    sql += ' AND b.id != ?'
    params.push(excludeId)
  }
  
  const existingBookings = db.prepare(sql).all(...params)
  
  for (const booking of existingBookings as any[]) {
    const conflict = !(endTime <= booking.start_time || startTime >= booking.end_time)
    if (conflict) {
      return {
        conflict: true,
        existingBooking: booking
      }
    }
  }
  return { conflict: false }
}

router.get('/', (req, res) => {
  try {
    const { date, hall_id, status } = req.query
    let sql = `
      SELECT b.*, h.name as hall_name, h.capacity as hall_capacity
      FROM bookings b
      JOIN banquet_halls h ON b.hall_id = h.id
      WHERE 1=1
    `
    const params: any[] = []
    
    if (date) {
      sql += ' AND b.booking_date = ?'
      params.push(date)
    }
    if (hall_id) {
      sql += ' AND b.hall_id = ?'
      params.push(hall_id)
    }
    if (status) {
      sql += ' AND b.status = ?'
      params.push(status)
    }
    
    sql += ' ORDER BY b.booking_date DESC, b.start_time DESC'
    
    const bookings = db.prepare(sql).all(...params)
    res.json({ success: true, data: bookings })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/calendar', (req, res) => {
  try {
    const { start_date, end_date } = req.query
    let sql = `
      SELECT b.id, b.hall_id, b.booking_date, b.start_time, b.end_time, 
             b.customer_name, b.event_type, b.status, b.tables_count,
             h.name as hall_name
      FROM bookings b
      JOIN banquet_halls h ON b.hall_id = h.id
      WHERE b.status != 'cancelled'
    `
    const params: any[] = []
    
    if (start_date) {
      sql += ' AND b.booking_date >= ?'
      params.push(start_date)
    }
    if (end_date) {
      sql += ' AND b.booking_date <= ?'
      params.push(end_date)
    }
    
    sql += ' ORDER BY b.booking_date, b.start_time'
    
    const bookings = db.prepare(sql).all(...params)
    res.json({ success: true, data: bookings })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id', (req, res) => {
  try {
    const booking = db.prepare(`
      SELECT b.*, h.name as hall_name, h.capacity as hall_capacity
      FROM bookings b
      JOIN banquet_halls h ON b.hall_id = h.id
      WHERE b.id = ?
    `).get(req.params.id)
    
    if (!booking) {
      return res.status(404).json({ success: false, error: '预订不存在' })
    }
    
    const salesPlan = db.prepare('SELECT * FROM sales_plans WHERE booking_id = ? ORDER BY version DESC LIMIT 1').get(req.params.id)
    const contract = db.prepare('SELECT * FROM contracts WHERE booking_id = ? LIMIT 1').get(req.params.id)
    const executionOrders = db.prepare('SELECT * FROM execution_orders WHERE booking_id = ?').all(req.params.id)
    
    res.json({ 
      success: true, 
      data: {
        ...booking,
        sales_plan: salesPlan || null,
        contract: contract || null,
        execution_orders: executionOrders
      }
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/check-conflict', (req, res) => {
  try {
    const { hall_id, booking_date, start_time, end_time } = req.body
    const result = checkTimeConflict(hall_id, booking_date, start_time, end_time)
    res.json({ success: true, data: result })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', (req, res) => {
  try {
    const { hall_id, booking_date, start_time, end_time, tables_count, min_consumption, customer_name, customer_phone, event_type, notes } = req.body
    
    const hall = db.prepare('SELECT * FROM banquet_halls WHERE id = ?').get(hall_id)
    if (!hall) {
      return res.status(404).json({ success: false, error: '宴会厅不存在' })
    }
    
    if (tables_count > (hall as any).capacity) {
      return res.status(400).json({ success: false, error: `桌数超出宴会厅容量（最大${(hall as any).capacity}桌）` })
    }
    
    const conflict = checkTimeConflict(hall_id, booking_date, start_time, end_time)
    if (conflict.conflict) {
      return res.status(400).json({ 
        success: false, 
        error: '档期冲突',
        conflict_booking: conflict.existingBooking
      })
    }
    
    const result = db.prepare(`
      INSERT INTO bookings (hall_id, booking_date, start_time, end_time, tables_count, min_consumption, customer_name, customer_phone, event_type, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(hall_id, booking_date, start_time, end_time, tables_count, min_consumption || 0, customer_name, customer_phone, event_type, notes)
    
    const booking = db.prepare(`
      SELECT b.*, h.name as hall_name 
      FROM bookings b
      JOIN banquet_halls h ON b.hall_id = h.id
      WHERE b.id = ?
    `).get(result.lastInsertRowid)
    
    res.json({ success: true, data: booking })
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ success: false, error: '档期已被占用' })
    }
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id', (req, res) => {
  try {
    const { hall_id, booking_date, start_time, end_time, tables_count, min_consumption, customer_name, customer_phone, event_type, status, notes } = req.body
    
    const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, error: '预订不存在' })
    }
    
    const hall = db.prepare('SELECT * FROM banquet_halls WHERE id = ?').get(hall_id)
    if (!hall) {
      return res.status(404).json({ success: false, error: '宴会厅不存在' })
    }
    
    if (tables_count > (hall as any).capacity) {
      return res.status(400).json({ success: false, error: `桌数超出宴会厅容量（最大${(hall as any).capacity}桌）` })
    }
    
    const conflict = checkTimeConflict(hall_id, booking_date, start_time, end_time, parseInt(req.params.id))
    if (conflict.conflict) {
      return res.status(400).json({ 
        success: false, 
        error: '档期冲突',
        conflict_booking: conflict.existingBooking
      })
    }
    
    db.prepare(`
      UPDATE bookings 
      SET hall_id = ?, booking_date = ?, start_time = ?, end_time = ?, tables_count = ?, min_consumption = ?, customer_name = ?, customer_phone = ?, event_type = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(hall_id, booking_date, start_time, end_time, tables_count, min_consumption, customer_name, customer_phone, event_type, status, notes, req.params.id)
    
    const booking = db.prepare(`
      SELECT b.*, h.name as hall_name 
      FROM bookings b
      JOIN banquet_halls h ON b.hall_id = h.id
      WHERE b.id = ?
    `).get(req.params.id)
    
    res.json({ success: true, data: booking })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id/status', (req, res) => {
  try {
    const { status } = req.body
    const result = db.prepare(`
      UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(status, req.params.id)
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '预订不存在' })
    }
    
    res.json({ success: true, message: '状态更新成功' })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id)
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '预订不存在' })
    }
    res.json({ success: true, message: '删除成功' })
  } catch (error: any) {
    if (error.message.includes('FOREIGN KEY constraint failed')) {
      return res.status(400).json({ success: false, error: '该预订已有关联数据，无法删除' })
    }
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
