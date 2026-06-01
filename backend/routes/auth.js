const express = require('express')
const { sign, auth } = require('../middleware/auth')

const router = express.Router()

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body || {}
    if (!username || !password) return res.status(400).json({ code: 400, message: '用户名和密码必填' })
    const user = req.db.prepare('SELECT * FROM users WHERE username = ? AND status = ?').get(username, 'active')
    if (!user) return res.status(401).json({ code: 401, message: '用户不存在或已停用' })
    const bcrypt = require('bcryptjs')
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ code: 401, message: '密码错误' })
    }
    const token = sign(user)
    req.db.prepare('INSERT INTO audit_logs (user_id, username, action, detail, ip) VALUES (?, ?, ?, ?, ?)')
      .run(user.id, user.username, 'login', `登录成功`, req.ip)
    res.json({
      code: 0,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          role: user.role,
          department: user.department
        }
      }
    })
  } catch (e) {
    console.error('[LOGIN ERR]', e)
    res.status(500).json({ code: 500, message: e.message || '登录异常' })
  }
})

router.post('/logout', auth, (req, res) => {
  req.db.prepare('INSERT INTO audit_logs (user_id, username, action, detail, ip) VALUES (?, ?, ?, ?, ?)')
    .run(req.user.id, req.user.username, 'logout', '登出', req.ip)
  res.json({ code: 0 })
})

router.get('/me', auth, (req, res) => {
  const user = req.db.prepare('SELECT id, username, display_name, role, department, status FROM users WHERE id = ?').get(req.user.id)
  res.json({ code: 0, data: user })
})

module.exports = router
