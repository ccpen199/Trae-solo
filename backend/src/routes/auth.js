const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const router = express.Router()

router.post('/login', (req, res) => {
  const { phone, password } = req.body
  const db = req.db

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone)
  if (!user) {
    return res.status(401).json({ message: '手机号或密码错误' })
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: '手机号或密码错误' })
  }

  const token = jwt.sign(
    { id: user.id, phone: user.phone, role: user.role },
    process.env.JWT_SECRET || 'wedding-saas-secret-key-2024',
    { expiresIn: '7d' }
  )

  const { password: _, ...userWithoutPassword } = user
  res.json({ token, user: userWithoutPassword })
})

router.post('/register', (req, res) => {
  const { phone, password, name, role } = req.body
  const db = req.db

  const existing = db.prepare('SELECT COUNT(*) as count FROM users WHERE phone = ?').get(phone)
  if (existing.count > 0) {
    return res.status(400).json({ message: '该手机号已注册' })
  }

  const hash = bcrypt.hashSync(password, 10)
  const userRole = role === 'merchant' ? 'merchant' : 'couple'

  const insertUser = db.prepare('INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)')
  const result = insertUser.run(phone, hash, name, userRole)
  const userId = result.lastInsertRowid

  if (userRole === 'couple') {
    db.prepare('INSERT INTO couples (user_id) VALUES (?)').run(userId)
  } else {
    db.prepare('INSERT INTO merchants (user_id, company_name) VALUES (?, ?)').run(userId, name)
  }

  res.json({ message: '注册成功' })
})

module.exports = router
