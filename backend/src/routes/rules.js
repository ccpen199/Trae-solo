const express = require('express')
const router = express.Router()
const db = require('../utils/db')

router.get('/', (req, res) => {
  try {
    const rules = db.prepare('SELECT * FROM settlement_rules ORDER BY created_at DESC').all()
    res.json(rules)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', (req, res) => {
  try {
    const { rule_name, rule_type, calculation_type, value, min_value, max_value } = req.body
    const result = db.prepare(`
      INSERT INTO settlement_rules (rule_name, rule_type, calculation_type, value, min_value, max_value)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(rule_name, rule_type, calculation_type, value, min_value, max_value)
    res.json({ id: result.lastInsertRowid, ...req.body })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/toggle', (req, res) => {
  try {
    db.prepare('UPDATE settlement_rules SET is_active = 1 - is_active WHERE id = ?').run(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
