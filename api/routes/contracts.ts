import express from 'express'
import db from '../db.js'

const router = express.Router()

router.get('/', (req, res) => {
  try {
    const contracts = db.prepare(`
      SELECT c.*, b.customer_name, b.booking_date, h.name as hall_name
      FROM contracts c
      JOIN bookings b ON c.booking_id = b.id
      JOIN banquet_halls h ON b.hall_id = h.id
      ORDER BY c.created_at DESC
    `).all()
    res.json({ success: true, data: contracts })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id', (req, res) => {
  try {
    const contract = db.prepare(`
      SELECT c.*, b.customer_name, b.customer_phone, b.booking_date, 
             b.start_time, b.end_time, h.name as hall_name
      FROM contracts c
      JOIN bookings b ON c.booking_id = b.id
      JOIN banquet_halls h ON b.hall_id = h.id
      WHERE c.id = ?
    `).get(req.params.id)
    
    if (!contract) {
      return res.status(404).json({ success: false, error: '合同不存在' })
    }
    
    const payments = db.prepare('SELECT * FROM payment_records WHERE contract_id = ? ORDER BY created_at DESC').all(req.params.id)
    
    res.json({ success: true, data: { ...contract, payments } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', (req, res) => {
  try {
    const { booking_id, contract_number, total_amount, deposit_amount, refund_rules } = req.body
    
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking_id)
    if (!booking) {
      return res.status(404).json({ success: false, error: '预订不存在' })
    }
    
    const existing = db.prepare('SELECT * FROM contracts WHERE booking_id = ?').get(booking_id)
    if (existing) {
      return res.status(400).json({ success: false, error: '该预订已有合同' })
    }
    
    const contractNo = contract_number || `HT${Date.now()}`
    
    const result = db.prepare(`
      INSERT INTO contracts (booking_id, contract_number, total_amount, deposit_amount, refund_rules, status)
      VALUES (?, ?, ?, ?, ?, 'draft')
    `).run(booking_id, contractNo, total_amount || 0, deposit_amount || 0, refund_rules || '')
    
    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(result.lastInsertRowid)
    res.json({ success: true, data: contract })
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ success: false, error: '合同编号已存在' })
    }
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/:id/payment', (req, res) => {
  try {
    const { amount, payment_type, payment_method, transaction_no, notes, created_by } = req.body
    
    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id)
    if (!contract) {
      return res.status(404).json({ success: false, error: '合同不存在' })
    }
    
    const result = db.prepare(`
      INSERT INTO payment_records (contract_id, amount, payment_type, payment_method, transaction_no, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.params.id, amount, payment_type, payment_method || '现金', transaction_no || '', notes || '', created_by || '系统')
    
    if (payment_type === 'deposit') {
      db.prepare(`
        UPDATE contracts 
        SET deposit_received = 1, deposit_received_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(req.params.id)
      
      db.prepare(`
        UPDATE bookings SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
        WHERE id = (SELECT booking_id FROM contracts WHERE id = ?)
      `).run(req.params.id)
    }
    
    const payment = db.prepare('SELECT * FROM payment_records WHERE id = ?').get(result.lastInsertRowid)
    res.json({ success: true, data: payment })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id/sign', (req, res) => {
  try {
    const result = db.prepare(`
      UPDATE contracts 
      SET status = 'signed', signed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id)
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '合同不存在' })
    }
    
    res.json({ success: true, message: '合同已签署' })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
