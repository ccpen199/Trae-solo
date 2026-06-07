import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'
import { authMiddleware, JWT_SECRET } from '../middleware.js'

const router = Router()

router.post('/register', (req: Request, res: Response): void => {
  try {
    const { username, password, phone, role, name, license_number, qualification, patient_name, patient_id_number, patient_medical_summary, patient_address, patient_phone } = req.body

    if (!username || !password || !role || !name) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    if (!['nurse', 'family'].includes(role)) {
      res.status(400).json({ success: false, error: '注册仅支持护士和家属角色' })
      return
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
    if (existing) {
      res.status(409).json({ success: false, error: '用户名已存在' })
      return
    }

    const password_hash = bcrypt.hashSync(password, 10)

    const insertUser = db.prepare(
      'INSERT INTO users (username, password_hash, phone, role, name) VALUES (?, ?, ?, ?, ?)'
    )
    const userId = insertUser.run(username, password_hash, phone || null, role, name).lastInsertRowid

    if (role === 'nurse') {
      const insertNurse = db.prepare(
        'INSERT INTO nurses (user_id, license_number, qualification, status) VALUES (?, ?, ?, ?)'
      )
      insertNurse.run(userId, license_number || null, qualification || null, 'pending')

      const nurseRow = db.prepare('SELECT id FROM nurses WHERE user_id = ?').get(userId) as { id: number }
      db.prepare(
        'INSERT INTO nurse_verifications (nurse_id, status) VALUES (?, ?)'
      ).run(nurseRow.id, 'pending')
    }

    if (role === 'family' && patient_name) {
      db.prepare(
        'INSERT INTO patients (family_user_id, name, id_number, medical_summary, address, phone) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(userId, patient_name, patient_id_number || null, patient_medical_summary || null, patient_address || null, patient_phone || null)
    }

    db.prepare(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, 'register', 'user', userId, req.ip)

    const token = jwt.sign(
      { id: userId, username, role, name },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      success: true,
      data: { token, user: { id: userId, username, role, name } }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/login', (req: Request, res: Response): void => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      res.status(400).json({ success: false, error: '缺少用户名或密码' })
      return
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any
    if (!user) {
      res.status(401).json({ success: false, error: '用户名或密码错误' })
      return
    }

    const valid = bcrypt.compareSync(password, user.password_hash)
    if (!valid) {
      res.status(401).json({ success: false, error: '用户名或密码错误' })
      return
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    db.prepare(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address) VALUES (?, ?, ?, ?, ?)'
    ).run(user.id, 'login', 'user', user.id, req.ip)

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, role: user.role, name: user.name, phone: user.phone }
      }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/me', authMiddleware, (req: Request, res: Response): void => {
  try {
    const user = db.prepare('SELECT id, username, phone, role, name, created_at FROM users WHERE id = ?').get(req.user!.id) as any
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    const result: any = { ...user }

    if (user.role === 'nurse') {
      const nurse = db.prepare('SELECT * FROM nurses WHERE user_id = ?').get(user.id) as any
      if (nurse) {
        result.nurse = nurse
        const verification = db.prepare('SELECT * FROM nurse_verifications WHERE nurse_id = ? ORDER BY created_at DESC LIMIT 1').get(nurse.id) as any
        result.verification = verification || null
      }
    }

    if (user.role === 'family') {
      const patients = db.prepare('SELECT * FROM patients WHERE family_user_id = ?').all(user.id) as any[]
      result.patients = patients
    }

    res.json({ success: true, data: result })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
