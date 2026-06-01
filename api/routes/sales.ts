import express from 'express'
import db from '../db.js'

const router = express.Router()

router.get('/:bookingId', (req, res) => {
  try {
    const plans = db.prepare(`
      SELECT * FROM sales_plans 
      WHERE booking_id = ? 
      ORDER BY version DESC
    `).all(req.params.bookingId)
    res.json({ success: true, data: plans })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', (req, res) => {
  try {
    const { booking_id, menu_items, drinks, decorations, equipment, service_fee, discount, total_amount } = req.body
    
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking_id)
    if (!booking) {
      return res.status(404).json({ success: false, error: '预订不存在' })
    }
    
    const latestPlan = db.prepare(`
      SELECT MAX(version) as max_version FROM sales_plans WHERE booking_id = ?
    `).get(booking_id) as any
    const newVersion = (latestPlan?.max_version || 0) + 1
    
    const result = db.prepare(`
      INSERT INTO sales_plans (booking_id, version, menu_items, drinks, decorations, equipment, service_fee, discount, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(booking_id, newVersion, JSON.stringify(menu_items || []), JSON.stringify(drinks || []), 
           JSON.stringify(decorations || []), JSON.stringify(equipment || []), 
           service_fee || 0, discount || 0, total_amount || 0)
    
    const plan = db.prepare('SELECT * FROM sales_plans WHERE id = ?').get(result.lastInsertRowid)
    res.json({ success: true, data: plan })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id/lock', (req, res) => {
  try {
    const { confirmed_by } = req.body
    
    const result = db.prepare(`
      UPDATE sales_plans 
      SET is_locked = 1, confirmed_at = CURRENT_TIMESTAMP, confirmed_by = ?
      WHERE id = ?
    `).run(confirmed_by || '系统', req.params.id)
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '销售方案不存在' })
    }
    
    const plan = db.prepare('SELECT * FROM sales_plans WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: plan })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
