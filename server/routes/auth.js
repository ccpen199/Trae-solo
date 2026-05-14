const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../database')
const { verifyPhone, verifyEmail } = require('../middleware/auth')

const router = express.Router()

router.post('/register', (req, res) => {
  const { username, email, phone, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ success: false, message: '请填写用户名和密码' })
  }

  try {
    const hash = bcrypt.hashSync(password, 10)
    const result = db.prepare(
      'INSERT INTO users (username, email, phone, password) VALUES (?, ?, ?, ?)'
    ).run(username, email, phone, hash)
    res.json({ success: true, message: '注册成功', data: { id: result.lastInsertRowid, username } })
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ success: false, message: '用户名、邮箱或手机号已存在' })
    }
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/login', (req, res) => {
  const { loginId, password } = req.body

  if (!loginId || !password) {
    return res.status(400).json({ success: false, message: '请填写登录账号和密码' })
  }

  let query = ''
  let params = []

  if (verifyPhone(loginId)) {
    query = 'SELECT * FROM users WHERE phone = ?'
    params = [loginId]
  } else if (verifyEmail(loginId)) {
    query = 'SELECT * FROM users WHERE email = ?'
    params = [loginId]
  } else {
    query = 'SELECT * FROM users WHERE username = ?'
    params = [loginId]
  }

  try {
    const user = db.prepare(query).get(params)

    if (!user) {
      return res.status(401).json({ success: false, message: '账号或密码错误' })
    }

    const result = bcrypt.compareSync(password, user.password)

    if (!result) {
      return res.status(401).json({ success: false, message: '账号或密码错误' })
    }

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' })
    res.json({ success: true, message: '登录成功', data: { token, user: { id: user.id, username: user.username, email: user.email, phone: user.phone } } })
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/check-phone', (req, res) => {
  const { phone } = req.body
  if (!phone) {
    return res.json({ success: false, message: '请输入手机号' })
  }

  if (!verifyPhone(phone)) {
    return res.json({ success: false, message: '手机号格式不正确' })
  }

  try {
    const row = db.prepare('SELECT COUNT(*) as count FROM users WHERE phone = ?').get(phone)
    res.json({ success: true, data: { exists: row.count > 0, valid: true } })
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/check-email', (req, res) => {
  const { email } = req.body
  if (!email) {
    return res.json({ success: false, message: '请输入邮箱' })
  }

  if (!verifyEmail(email)) {
    return res.json({ success: false, message: '邮箱格式不正确' })
  }

  try {
    const row = db.prepare('SELECT COUNT(*) as count FROM users WHERE email = ?').get(email)
    res.json({ success: true, data: { exists: row.count > 0, valid: true } })
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/check-username', (req, res) => {
  const { username } = req.body
  if (!username) {
    return res.json({ success: false, message: '请输入用户名' })
  }

  try {
    const row = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get(username)
    res.json({ success: true, data: { exists: row.count > 0 } })
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/social-login', (req, res) => {
  const { platform, openId, nickname } = req.body

  if (!platform || !openId) {
    return res.status(400).json({ success: false, message: '缺少必要参数' })
  }

  try {
    const socialField = platform === 'alipay' ? 'alipay_openid' : 'wechat_openid'
    
    let user = db.prepare(`SELECT * FROM users WHERE ${socialField} = ?`).get(openId)
    
    if (!user) {
      const tempUsername = nickname || `${platform}_${openId.slice(-8)}`
      const defaultPassword = bcrypt.hashSync('123456', 10)
      
      const result = db.prepare(
        `INSERT INTO users (username, password, ${socialField}) VALUES (?, ?, ?)`
      ).run(tempUsername, defaultPassword, openId)
      
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid)
    }
    
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' })
    res.json({ 
      success: true, 
      message: '登录成功', 
      data: { 
        token, 
        user: { id: user.id, username: user.username, email: user.email, phone: user.phone }
      } 
    })
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ success: false, message: '该账号已绑定其他用户' })
    }
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
})

module.exports = router