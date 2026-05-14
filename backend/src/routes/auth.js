const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const db = require('../database')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

router.post('/send-code', (req, res) => {
  try {
    const { phone } = req.body

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: '请输入正确的手机号' })
    }

    const code = Math.random().toString().slice(2, 8)
    const expiredAt = Math.floor(Date.now() / 1000) + 5 * 60

    db.prepare('DELETE FROM verification_codes WHERE phone = ?').run(phone)
    db.prepare('INSERT INTO verification_codes (phone, code, expired_at) VALUES (?, ?, ?)').run(phone, code, expiredAt)

    console.log(`验证码: ${code} (手机号: ${phone})`)

    res.json({ success: true, message: '验证码已发送', code })
  } catch (error) {
    console.error('发送验证码失败:', error)
    res.status(500).json({ success: false, message: '发送验证码失败' })
  }
})

router.post('/login-code', (req, res) => {
  try {
    const { phone, code } = req.body

    if (!phone || !code) {
      return res.status(400).json({ success: false, message: '手机号和验证码不能为空' })
    }

    const codeStmt = db.prepare('SELECT * FROM verification_codes WHERE phone = ? ORDER BY created_at DESC LIMIT 1')
    const verifyCode = codeStmt.get(phone)

    if (!verifyCode || verifyCode.code !== code || verifyCode.expired_at < Math.floor(Date.now() / 1000)) {
      return res.status(400).json({ success: false, message: '验证码错误或已过期' })
    }

    let userStmt = db.prepare('SELECT * FROM users WHERE phone = ?')
    let user = userStmt.get(phone)

    if (!user) {
      const nickname = `用户${phone.slice(-4)}`
      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`
      const result = db.prepare('INSERT INTO users (phone, nickname, avatar) VALUES (?, ?, ?)').run(phone, nickname, avatar)
      user = {
        id: result.lastInsertRowid,
        phone,
        nickname,
        avatar
      }
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'knowledge_community_secret_key_2024', { expiresIn: '7d' })

    db.prepare('DELETE FROM verification_codes WHERE phone = ?').run(phone)

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          bio: user.bio
        }
      }
    })
  } catch (error) {
    console.error('验证码登录失败:', error)
    res.status(500).json({ success: false, message: '登录失败' })
  }
})

router.post('/login-password', (req, res) => {
  try {
    const { phone, password } = req.body

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: '手机号和密码不能为空' })
    }

    const userStmt = db.prepare('SELECT * FROM users WHERE phone = ?')
    const user = userStmt.get(phone)

    if (!user) {
      return res.status(400).json({ success: false, message: '用户不存在，请先注册' })
    }

    if (!user.password) {
      return res.status(400).json({ success: false, message: '该账号未设置密码，请使用验证码登录' })
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ success: false, message: '密码错误' })
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'knowledge_community_secret_key_2024', { expiresIn: '7d' })

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          bio: user.bio
        }
      }
    })
  } catch (error) {
    console.error('密码登录失败:', error)
    res.status(500).json({ success: false, message: '登录失败' })
  }
})

router.post('/set-password', authenticateToken, (req, res) => {
  try {
    const { password } = req.body

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: '密码长度至少6位' })
    }

    const hashedPassword = bcrypt.hashSync(password, 10)
    db.prepare('UPDATE users SET password = ?, updated_at = strftime("%s", "now") WHERE id = ?').run(hashedPassword, req.user.id)

    res.json({ success: true, message: '密码设置成功' })
  } catch (error) {
    console.error('设置密码失败:', error)
    res.status(500).json({ success: false, message: '设置密码失败' })
  }
})

router.get('/profile', authenticateToken, (req, res) => {
  res.json({ success: true, data: req.user })
})

module.exports = router
