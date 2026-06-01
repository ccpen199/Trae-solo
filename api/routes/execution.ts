import express from 'express'
import db from '../db.js'

const router = express.Router()

router.get('/', (req, res) => {
  try {
    const { department, status, booking_id } = req.query
    let sql = `
      SELECT e.*, b.customer_name, b.booking_date, h.name as hall_name
      FROM execution_orders e
      JOIN bookings b ON e.booking_id = b.id
      JOIN banquet_halls h ON b.hall_id = h.id
      WHERE 1=1
    `
    const params: any[] = []
    
    if (department) {
      sql += ' AND e.department = ?'
      params.push(department)
    }
    if (status) {
      sql += ' AND e.status = ?'
      params.push(status)
    }
    if (booking_id) {
      sql += ' AND e.booking_id = ?'
      params.push(booking_id)
    }
    
    sql += ' ORDER BY e.created_at DESC'
    
    const orders = db.prepare(sql).all(...params)
    res.json({ success: true, data: orders })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id', (req, res) => {
  try {
    const order = db.prepare(`
      SELECT e.*, b.customer_name, b.booking_date, b.start_time, b.end_time, h.name as hall_name
      FROM execution_orders e
      JOIN bookings b ON e.booking_id = b.id
      JOIN banquet_halls h ON b.hall_id = h.id
      WHERE e.id = ?
    `).get(req.params.id)
    
    if (!order) {
      return res.status(404).json({ success: false, error: '执行单不存在' })
    }
    
    res.json({ success: true, data: order })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', (req, res) => {
  try {
    const { booking_id, department, content, assignee, priority, due_time } = req.body
    
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking_id)
    if (!booking) {
      return res.status(404).json({ success: false, error: '预订不存在' })
    }
    
    const result = db.prepare(`
      INSERT INTO execution_orders (booking_id, department, content, assignee, priority, due_time, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(booking_id, department, content, assignee || '', priority || 'normal', due_time || null)
    
    const order = db.prepare('SELECT * FROM execution_orders WHERE id = ?').get(result.lastInsertRowid)
    res.json({ success: true, data: order })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/batch', (req, res) => {
  try {
    const { booking_id, orders } = req.body
    
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking_id)
    if (!booking) {
      return res.status(404).json({ success: false, error: '预订不存在' })
    }
    
    const insertStmt = db.prepare(`
      INSERT INTO execution_orders (booking_id, department, content, assignee, priority, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `)
    
    const createdOrders: any[] = []
    
    const transaction = db.transaction((orderList: any[]) => {
      for (const order of orderList) {
        const result = insertStmt.run(booking_id, order.department, order.content, order.assignee || '', order.priority || 'normal')
        const created = db.prepare('SELECT * FROM execution_orders WHERE id = ?').get(result.lastInsertRowid)
        createdOrders.push(created)
      }
    })
    
    transaction(orders)
    
    res.json({ success: true, data: createdOrders })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id', (req, res) => {
  try {
    const { content, assignee, priority, status, due_time } = req.body
    
    const result = db.prepare(`
      UPDATE execution_orders 
      SET content = ?, assignee = ?, priority = ?, status = ?, due_time = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(content, assignee, priority, status, due_time, req.params.id)
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '执行单不存在' })
    }
    
    if (status === 'completed') {
      db.prepare(`
        UPDATE execution_orders SET completed_at = CURRENT_TIMESTAMP, completed_by = ? WHERE id = ?
      `).run(req.body.completed_by || '系统', req.params.id)
    }
    
    const order = db.prepare('SELECT * FROM execution_orders WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: order })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM execution_orders WHERE id = ?').run(req.params.id)
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '执行单不存在' })
    }
    res.json({ success: true, message: '删除成功' })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
