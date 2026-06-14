const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const db = require('../database')

const router = express.Router()

router.post('/register',
  body('phone').isMobilePhone('zh-CN'),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['owner', 'master']),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { phone, password, name, role } = req.body

    const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone)
    if (existingUser) {
      return res.status(400).json({ message: '手机号已注册' })
    }

    const hashedPassword = bcrypt.hashSync(password, 10)
    const result = db.prepare('INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)').run(phone, hashedPassword, name || '', role)

    if (role === 'master') {
      db.prepare('INSERT INTO master_profiles (user_id) VALUES (?)').run(result.lastInsertRowid)
    }

    const token = jwt.sign({ userId: result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: result.lastInsertRowid, phone, name, role } })
  }
)

router.post('/login',
  body('phone').isMobilePhone('zh-CN'),
  body('password').isLength({ min: 6 }),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { phone, password } = req.body
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone)

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: '手机号或密码错误' })
    }

    if (user.status !== 'active') {
      return res.status(401).json({ message: '账户已禁用' })
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, phone: user.phone, name: user.name, role: user.role } })
  }
)

router.get('/profile', require('../middleware/auth').authMiddleware, (req, res) => {
  const profile = { ...req.user }
  
  if (req.user.role === 'master') {
    const masterProfile = db.prepare('SELECT * FROM master_profiles WHERE user_id = ?').get(req.user.id)
    const verification = db.prepare('SELECT * FROM master_verifications WHERE user_id = ?').get(req.user.id)
    profile.masterProfile = masterProfile
    profile.verification = verification
  }
  
  res.json(profile)
})

module.exports = router
