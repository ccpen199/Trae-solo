import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db/index.js'
import { z } from 'zod'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dental_clinic_secret_key_2024'

const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空')
})

router.post('/login', (req, res) => {
  try {
    const { username, password } = loginSchema.parse(req.body)

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    const validPassword = bcrypt.compareSync(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        phone: user.phone
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    res.status(500).json({ error: '登录失败' })
  }
})

export function initDefaultUsers() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  
  if (userCount.count === 0) {
    const insertUser = db.prepare(
      'INSERT INTO users (username, password, name, role, phone) VALUES (?, ?, ?, ?, ?)'
    )

    const adminPassword = bcrypt.hashSync('admin123', 10)
    insertUser.run('admin', adminPassword, '系统管理员', 'admin', '13800138000')

    const doctorPassword = bcrypt.hashSync('doctor123', 10)
    insertUser.run('doctor1', doctorPassword, '张医生', 'doctor', '13800138001')
    insertUser.run('doctor2', doctorPassword, '李医生', 'doctor', '13800138002')

    const nursePassword = bcrypt.hashSync('nurse123', 10)
    insertUser.run('nurse1', nursePassword, '王护士', 'nurse', '13800138003')

    const receptionPassword = bcrypt.hashSync('reception123', 10)
    insertUser.run('reception', receptionPassword, '前台小王', 'reception', '13800138004')

    const financePassword = bcrypt.hashSync('finance123', 10)
    insertUser.run('finance', financePassword, '财务小李', 'finance', '13800138005')

    console.log('默认用户已创建')
  }
}

export default router
