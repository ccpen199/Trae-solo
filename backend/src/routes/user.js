const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const router = express.Router()

router.use(authMiddleware)

router.get('/profile', (req, res) => {
  const db = req.db
  const user = db.prepare('SELECT id, phone, name, avatar, role, created_at FROM users WHERE id = ?').get(req.user.id)
  
  if (user.role === 'couple') {
    const couple = db.prepare('SELECT * FROM couples WHERE user_id = ?').get(req.user.id)
    user.profile = couple
  } else if (user.role === 'merchant') {
    const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(req.user.id)
    user.profile = merchant
  }
  
  res.json(user)
})

router.put('/profile', (req, res) => {
  const db = req.db
  const { name, avatar } = req.body
  
  db.prepare('UPDATE users SET name = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(name || req.user.name, avatar, req.user.id)
  
  const user = db.prepare('SELECT id, phone, name, avatar, role, created_at FROM users WHERE id = ?').get(req.user.id)
  res.json(user)
})

module.exports = router
