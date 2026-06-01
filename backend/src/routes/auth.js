const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../database/init')
const { JWT_SECRET } = require('../middleware/auth')

const router = express.Router()

router.post('/login', (req, res) => {
  const { phone, password } = req.body
  
  if (!phone || !password) {
    return res.status(400).json({ error: '手机号和密码不能为空' })
  }

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone)
  
  if (!user) {
    return res.status(401).json({ error: '手机号或密码错误' })
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: '手机号或密码错误' })
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })

  res.json({
    token,
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      role: user.role,
      credit_score: user.credit_score
    }
  })
})

router.post('/register', (req, res) => {
  const { phone, password, nickname } = req.body
  
  if (!phone || !password) {
    return res.status(400).json({ error: '手机号和密码不能为空' })
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone)
  if (existingUser) {
    return res.status(400).json({ error: '手机号已注册' })
  }

  const password_hash = bcrypt.hashSync(password, 10)
  
  const result = db.prepare(
    'INSERT INTO users (phone, nickname, password_hash) VALUES (?, ?, ?)'
  ).run(phone, nickname || phone, password_hash)

  const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '7d' })

  res.json({
    token,
    user: {
      id: result.lastInsertRowid,
      phone,
      nickname: nickname || phone,
      role: 'user',
      credit_score: 650
    }
  })
})

module.exports = router
