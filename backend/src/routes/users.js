const express = require('express')
const router = express.Router()
const db = require('../utils/db')

router.get('/', (req, res) => {
  try {
    const { user_type } = req.query
    let sql = 'SELECT * FROM users WHERE 1=1'
    const params = []
    if (user_type) {
      sql += ' AND user_type = ?'
      params.push(user_type)
    }
    sql += ' ORDER BY created_at DESC'
    const users = db.prepare(sql).all(...params)
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', (req, res) => {
  try {
    const { user_type, username, name, phone, id_card, bank_name, bank_account, bank_account_name, tax_identity } = req.body
    const result = db.prepare(`
      INSERT INTO users (user_type, username, name, phone, id_card, bank_name, bank_account, bank_account_name, tax_identity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user_type, username, name, phone, id_card, bank_name, bank_account, bank_account_name, tax_identity)
    res.json({ id: result.lastInsertRowid, ...req.body })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', (req, res) => {
  try {
    const { name, phone, id_card, id_card_verified, agreement_status, bank_name, bank_account, bank_account_name, tax_identity, risk_status } = req.body
    const oldUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)
    db.prepare(`
      UPDATE users SET name = ?, phone = ?, id_card = ?, id_card_verified = ?, agreement_status = ?, 
      bank_name = ?, bank_account = ?, bank_account_name = ?, tax_identity = ?, risk_status = ?, updated_at = strftime('%s', 'now')
      WHERE id = ?
    `).run(name, phone, id_card, id_card_verified, agreement_status, bank_name, bank_account, bank_account_name, tax_identity, risk_status, req.params.id)
    db.prepare(`
      INSERT INTO operation_logs (operator_id, operation_type, target_type, target_id, old_value, new_value, remark)
      VALUES (?, 'update', 'user', ?, ?, ?, '更新用户信息')
    `).run(1, req.params.id, JSON.stringify(oldUser), JSON.stringify(req.body))
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id/can-settle', (req, res) => {
  try {
    const user = db.prepare('SELECT id_card_verified, agreement_status, risk_status FROM users WHERE id = ?').get(req.params.id)
    if (!user) {
      return res.json({ canSettle: false, reason: '用户不存在' })
    }
    if (!user.id_card_verified || user.id_card_verified === 0) {
      return res.json({ canSettle: false, reason: '实名认证未通过' })
    }
    if (user.agreement_status !== 'approved') {
      return res.json({ canSettle: false, reason: '协议未通过' })
    }
    if (user.risk_status === 'blocked') {
      return res.json({ canSettle: false, reason: '用户处于风险阻断状态' })
    }
    res.json({ canSettle: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
