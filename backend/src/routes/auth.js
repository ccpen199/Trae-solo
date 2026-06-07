import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../utils/db.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.post('/register', (req, res) => {
  const { username, password, role, phone, real_name, id_card_no } = req.body
  
  if (!username || !password || !role || !phone) {
    return res.status(400).json({ code: 400, message: '缺少必要参数' })
  }
  
  if (!['shipper', 'driver'].includes(role)) {
    return res.status(400).json({ code: 400, message: '无效的用户角色' })
  }
  
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR phone = ?').get(username, phone)
  if (existingUser) {
    return res.status(400).json({ code: 400, message: '用户名或手机号已存在' })
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10)
  
  const result = db.prepare(`
    INSERT INTO users (username, password, role, phone, real_name, id_card_no, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).run(username, hashedPassword, role, phone, real_name || null, id_card_no || null)
  
  db.prepare('INSERT OR IGNORE INTO wallets (user_id, balance) VALUES (?, 0)').run(result.lastInsertRowid)
  
  if (role === 'driver') {
    db.prepare(`
      INSERT OR IGNORE INTO driver_location (driver_id, lng, lat, city, is_online, is_available)
      VALUES (?, 0, 0, '', 0, 0)
    `).run(result.lastInsertRowid)
  }
  
  res.json({ code: 200, message: '注册成功，请等待认证审核', data: { userId: result.lastInsertRowid } })
})

router.post('/login', (req, res) => {
  const { username, password } = req.body
  
  if (!username || !password) {
    return res.status(400).json({ code: 400, message: '请输入用户名和密码' })
  }
  
  const user = db.prepare('SELECT * FROM users WHERE username = ? OR phone = ?').get(username, username)
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ code: 401, message: '用户名或密码错误' })
  }
  
  if (user.status === 'banned') {
    return res.status(403).json({ code: 403, message: '账号已被封禁' })
  }
  
  const token = jwt.sign(
    { userId: user.id, role: user.role, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
  
  let extraInfo = {}
  if (user.role === 'shipper') {
    extraInfo.enterprise = db.prepare('SELECT * FROM enterprise_info WHERE shipper_id = ?').get(user.id)
  } else if (user.role === 'driver') {
    extraInfo.driverInfo = db.prepare(`
      SELECT di.*, dl.lng, dl.lat, dl.city, dl.is_online, dl.is_available
      FROM driver_info di
      LEFT JOIN driver_location dl ON di.driver_id = dl.driver_id
      WHERE di.driver_id = ?
    `).get(user.id)
  }
  
  const wallet = db.prepare('SELECT balance, frozen_balance FROM wallets WHERE user_id = ?').get(user.id)
  
  res.json({
    code: 200,
    message: '登录成功',
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        phone: user.phone,
        real_name: user.real_name,
        status: user.status,
        created_at: user.created_at
      },
      ...extraInfo,
      wallet
    }
  })
})

router.get('/profile', authenticate, (req, res) => {
  let extraInfo = {}
  if (req.user.role === 'shipper') {
    extraInfo.enterprise = db.prepare('SELECT * FROM enterprise_info WHERE shipper_id = ?').get(req.user.id)
  } else if (req.user.role === 'driver') {
    extraInfo.driverInfo = db.prepare(`
      SELECT di.*, dl.lng, dl.lat, dl.city, dl.is_online, dl.is_available
      FROM driver_info di
      LEFT JOIN driver_location dl ON di.driver_id = dl.driver_id
      WHERE di.driver_id = ?
    `).get(req.user.id)
  }
  
  const wallet = db.prepare('SELECT balance, frozen_balance, total_income, total_expend FROM wallets WHERE user_id = ?').get(req.user.id)
  
  res.json({
    code: 200,
    data: {
      user: req.user,
      ...extraInfo,
      wallet
    }
  })
})

router.post('/logout', authenticate, (req, res) => {
  res.json({ code: 200, message: '退出成功' })
})

export default router
