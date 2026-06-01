import express from 'express'
import db from '../db.js'

const router = express.Router()

router.get('/revenue', (req, res) => {
  try {
    const { start_date, end_date } = req.query
    
    let sql = `
      SELECT 
        b.booking_date,
        COUNT(DISTINCT b.id) as booking_count,
        SUM(b.tables_count) as total_tables,
        SUM(c.total_amount) as total_revenue,
        SUM(c.deposit_amount) as total_deposit
      FROM bookings b
      LEFT JOIN contracts c ON b.id = c.booking_id
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
    
    sql += ' GROUP BY b.booking_date ORDER BY b.booking_date DESC'
    
    const data = db.prepare(sql).all(...params)
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/hall-usage', (req, res) => {
  try {
    const { start_date, end_date } = req.query
    
    let sql = `
      SELECT 
        h.id,
        h.name,
        h.capacity,
        h.status,
        COUNT(b.id) as booking_count,
        SUM(b.tables_count) as total_tables
      FROM banquet_halls h
      LEFT JOIN bookings b ON h.id = b.hall_id AND b.status != 'cancelled'
      WHERE h.status = 'active'
    `
    const params: any[] = []
    
    if (start_date) {
      sql += ' AND (b.booking_date >= ? OR b.booking_date IS NULL)'
      params.push(start_date)
    }
    if (end_date) {
      sql += ' AND (b.booking_date <= ? OR b.booking_date IS NULL)'
      params.push(end_date)
    }
    
    sql += ' GROUP BY h.id, h.name, h.capacity, h.status ORDER BY booking_count DESC'
    
    const data = db.prepare(sql).all(...params)
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/event-types', (req, res) => {
  try {
    const data = db.prepare(`
      SELECT 
        event_type,
        COUNT(*) as count,
        SUM(tables_count) as total_tables
      FROM bookings 
      WHERE status != 'cancelled'
      GROUP BY event_type
      ORDER BY count DESC
    `).all()
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/execution-summary', (req, res) => {
  try {
    const data = db.prepare(`
      SELECT 
        department,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM execution_orders
      GROUP BY department
    `).all()
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/checklist', (req, res) => {
  try {
    const { booking_id } = req.query
    
    if (!booking_id) {
      return res.status(400).json({ success: false, error: '请指定预订ID' })
    }
    
    const booking = db.prepare(`
      SELECT b.*, h.name as hall_name
      FROM bookings b
      JOIN banquet_halls h ON b.hall_id = h.id
      WHERE b.id = ?
    `).get(booking_id)
    
    if (!booking) {
      return res.status(404).json({ success: false, error: '预订不存在' })
    }
    
    const salesPlan = db.prepare('SELECT * FROM sales_plans WHERE booking_id = ? AND is_locked = 1').get(booking_id)
    const contract = db.prepare('SELECT * FROM contracts WHERE booking_id = ?').get(booking_id)
    const depositReceived = contract && (contract as any).deposit_received
    const executionOrders = db.prepare('SELECT * FROM execution_orders WHERE booking_id = ?').all(booking_id)
    const allExecuted = executionOrders.length > 0 && executionOrders.every((e: any) => e.status === 'completed')
    
    const conflicts = db.prepare(`
      SELECT COUNT(*) as count FROM bookings b1
      JOIN bookings b2 ON b1.hall_id = b2.hall_id 
        AND b1.booking_date = b2.booking_date
        AND b1.id != b2.id
        AND b1.status != 'cancelled'
        AND b2.status != 'cancelled'
      WHERE b1.id = ?
        AND NOT (b1.end_time <= b2.start_time OR b1.start_time >= b2.end_time)
    `).get(booking_id) as any
    
    res.json({
      success: true,
      data: {
        booking,
        checks: {
          has_conflict: conflicts.count > 0,
          has_sales_plan: !!salesPlan,
          has_contract: !!contract,
          deposit_received: !!depositReceived,
          has_execution_orders: executionOrders.length > 0,
          all_executed: allExecuted
        },
        sales_plan: salesPlan || null,
        contract: contract || null,
        execution_orders: executionOrders
      }
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/pending-deposit-alert', (req, res) => {
  try {
    const data = db.prepare(`
      SELECT 
        b.*,
        h.name as hall_name,
        c.contract_number,
        c.deposit_amount,
        julianday('now') - julianday(b.created_at) as days_passed
      FROM bookings b
      JOIN banquet_halls h ON b.hall_id = h.id
      LEFT JOIN contracts c ON b.id = c.booking_id
      WHERE b.status = 'pending'
        AND (c.deposit_received = 0 OR c.deposit_received IS NULL)
        AND julianday(b.booking_date) - julianday('now') <= 7
      ORDER BY b.booking_date ASC
    `).all()
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
