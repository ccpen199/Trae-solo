import { Router } from 'express'
import db from '../db/index.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

router.get('/doctors', authenticateToken, (req, res) => {
  try {
    const doctors = db.prepare(`
      SELECT id, name, username, role, phone 
      FROM users 
      WHERE role = 'doctor'
      ORDER BY name
    `).all()
    res.json(doctors)
  } catch (error) {
    res.status(500).json({ error: '获取医生列表失败' })
  }
})

router.get('/users', authenticateToken, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, username, role, phone, created_at 
      FROM users 
      ORDER BY role, name
    `).all()
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: '获取用户列表失败' })
  }
})

router.get('/chairs', authenticateToken, (req, res) => {
  try {
    const chairs = db.prepare(`
      SELECT * FROM chairs 
      WHERE status = 'active'
      ORDER BY name
    `).all()
    res.json(chairs)
  } catch (error) {
    res.status(500).json({ error: '获取椅位列表失败' })
  }
})

router.get('/treatments', authenticateToken, (req, res) => {
  try {
    const { category } = req.query
    let query = 'SELECT * FROM treatments WHERE 1=1'
    const params: any[] = []
    
    if (category) {
      query += ' AND category = ?'
      params.push(category)
    }
    query += ' ORDER BY category, name'
    
    const treatments = db.prepare(query).all(...params)
    res.json(treatments)
  } catch (error) {
    res.status(500).json({ error: '获取治疗项目失败' })
  }
})

router.get('/stats', authenticateToken, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const patientCount = db.prepare('SELECT COUNT(*) as count FROM patients').get() as { count: number }
    const appointmentToday = db.prepare('SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ?').get(today) as { count: number }
    const pendingInvoices = db.prepare('SELECT COUNT(*) as count FROM invoices WHERE status IN (?, ?)').get('pending', 'partial') as { count: number }
    const lowStock = db.prepare('SELECT COUNT(*) as count FROM supplies WHERE quantity <= min_quantity').get() as { count: number }

    res.json({
      patient_count: patientCount.count,
      appointment_today: appointmentToday.count,
      pending_invoices: pendingInvoices.count,
      low_stock: lowStock.count
    })
  } catch (error) {
    res.status(500).json({ error: '获取统计失败' })
  }
})

export default router
