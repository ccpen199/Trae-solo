const express = require('express')
const { db } = require('../database')
const router = express.Router()

router.post('/login', (req, res) => {
  const { username, password } = req.body
  
  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' })
  }

  const stmt = db.prepare('SELECT * FROM users WHERE username = ?')
  const user = stmt.get(username)
  
  if (!user) {
    return res.status(401).json({ error: '用户不存在' })
  }

  if (user.password !== password) {
    return res.status(401).json({ error: '密码错误' })
  }

  res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role
  })
})

router.get('/users', (req, res) => {
  const stmt = db.prepare('SELECT id, username, name, role, created_at FROM users')
  const users = stmt.all()
  res.json(users)
})

module.exports = router
