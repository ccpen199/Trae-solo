const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { db } = require('../models/database')

function sendCode(req, res) {
  const { phone } = req.body
  
  if (!phone) {
    return res.status(400).json({ success: false, message: '手机号不能为空' })
  }

  const code = Math.random().toString().slice(2, 8)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const stmt = db.prepare('INSERT INTO verification_codes (phone, code, expires_at) VALUES (?, ?, ?)')
  stmt.run(phone, code, expiresAt)

  console.log(`验证码: ${code} (手机号: ${phone})`)
  res.json({ success: true, message: '验证码已发送', code })
}

function register(req, res) {
  const { phone, code, password, avatar, birthday, signature, gender } = req.body

  if (!phone || !code || !password || !avatar || !birthday || !gender) {
    return res.status(400).json({ success: false, message: '缺少必填信息' })
  }

  const latestCode = db.prepare('SELECT * FROM verification_codes WHERE phone = ? ORDER BY created_at DESC LIMIT 1').get(phone)
  
  if (!latestCode || latestCode.code !== code) {
    return res.status(400).json({ success: false, message: '验证码错误' })
  }

  if (new Date(latestCode.expires_at) < new Date()) {
    return res.status(400).json({ success: false, message: '验证码已过期' })
  }

  const hashedPassword = bcrypt.hashSync(password, 10)
  const constellation = getConstellation(birthday)

  try {
    const stmt = db.prepare('INSERT INTO users (phone, password, avatar, birthday, signature, gender, constellation) VALUES (?, ?, ?, ?, ?, ?, ?)')
    const result = stmt.run(phone, hashedPassword, avatar, birthday, signature || '', gender, constellation)
    const userId = result.lastInsertRowid

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ success: true, message: '注册成功', data: { token, userId } })
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ success: false, message: '手机号已注册' })
    }
    return res.status(500).json({ success: false, message: '注册失败' })
  }
}

function login(req, res) {
  const { phone, password } = req.body

  if (!phone || !password) {
    return res.status(400).json({ success: false, message: '手机号和密码不能为空' })
  }

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone)

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(400).json({ success: false, message: '手机号或密码错误' })
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
  delete user.password
  res.json({ success: true, message: '登录成功', data: { token, user } })
}

function getCurrentUser(req, res) {
  const user = db.prepare('SELECT id, phone, avatar, nickname, birthday, signature, gender, constellation, planet_id FROM users WHERE id = ?').get(req.user.userId)
  
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' })
  }
  res.json({ success: true, data: user })
}

function getConstellation(birthday) {
  const date = new Date(birthday)
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  const constellations = [
    { name: '摩羯座', start: [12, 22], end: [1, 19] },
    { name: '水瓶座', start: [1, 20], end: [2, 18] },
    { name: '双鱼座', start: [2, 19], end: [3, 20] },
    { name: '白羊座', start: [3, 21], end: [4, 19] },
    { name: '金牛座', start: [4, 20], end: [5, 20] },
    { name: '双子座', start: [5, 21], end: [6, 21] },
    { name: '巨蟹座', start: [6, 22], end: [7, 22] },
    { name: '狮子座', start: [7, 23], end: [8, 22] },
    { name: '处女座', start: [8, 23], end: [9, 22] },
    { name: '天秤座', start: [9, 23], end: [10, 23] },
    { name: '天蝎座', start: [10, 24], end: [11, 22] },
    { name: '射手座', start: [11, 23], end: [12, 21] }
  ]

  for (const c of constellations) {
    if ((month === c.start[0] && day >= c.start[1]) ||
        (month === c.end[0] && day <= c.end[1])) {
      return c.name
    }
  }
  return '摩羯座'
}

module.exports = { sendCode, register, login, getCurrentUser }
