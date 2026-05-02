import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { db } from '../models/database.js'

const router = express.Router()
const JWT_SECRET = 'tms-secret-key-2024'

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)

    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' })
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password) || password === user.password
    if (!isPasswordValid) {
      return res.status(401).json({ message: '用户名或密码错误' })
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
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
    console.error('Login error:', error)
    res.status(500).json({ message: '登录失败' })
  }
})

router.post('/logout', (req, res) => {
  res.json({ message: '登出成功' })
})

router.get('/profile', (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ message: '未授权' })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)

    const user = db.prepare('SELECT id, username, name, role, phone, email FROM users WHERE id = ?').get(decoded.userId)

    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }

    res.json({ user })
  } catch (error) {
    res.status(401).json({ message: '未授权' })
  }
})

export default router
