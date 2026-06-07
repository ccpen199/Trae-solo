const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../config/database')
const { JWT_SECRET } = require('../middleware/auth')

const router = express.Router()

router.post('/register', (req, res) => {
  const { username, password, nickname, phone } = req.body
  const hashedPassword = bcrypt.hashSync(password, 10)
  
  try {
    const result = db.prepare(`
      INSERT INTO users (username, password, nickname, phone, role)
      VALUES (?, ?, ?, ?, 'user')
    `).run(username, hashedPassword, nickname || username, phone)
    
    const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '7d' })
    
    res.json({
      token,
      user: {
        id: result.lastInsertRowid,
        username,
        nickname: nickname || username,
        role: 'user'
      }
    })
  } catch (err) {
    res.status(400).json({ error: '用户名或手机号已存在' })
  }
})

router.post('/login', (req, res) => {
  const { username, password } = req.body
  const user = db.prepare('SELECT * FROM users WHERE username = ? OR phone = ?').get(username, username)
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }
  
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
  
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      role: user.role,
      member_level: user.member_level,
      avatar: user.avatar
    }
  })
})

module.exports = router
