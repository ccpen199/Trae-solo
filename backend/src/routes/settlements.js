const express = require('express')
const router = express.Router()
const db = require('../utils/db')

const calculateTax = (amount) => {
  if (amount <= 0) return 0
  if (amount <= 4000) {
    return (amount - 800) * 0.2
  }
  return amount * 0.8 * 0.2
}

router.get('/', (req, res) => {
  try {
    const settlements = db.prepare(`
      SELECT s.*, u.name as freelancer_name, p.project_name
      FROM settlements s
      LEFT JOIN users u ON s.freelancer_id = u.id
      LEFT JOIN projects p ON s.project_id = p.id
      ORDER BY s.created_at DESC
    `).all()
    res.json(settlements)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/pending-tasks/:freelancerId', (req, res) => {
  try {
    const tasks = db.prepare(`
      SELECT t.*, tb.batch_name, p.project_name
      FROM tasks t
      LEFT JOIN task_batches tb ON t.batch_id = tb.id
      LEFT JOIN projects p ON tb.project_id = p.id
      WHERE t.freelancer_id = ? AND t.acceptance_status = 'approved' AND t.settled = 0
      ORDER BY t.created_at DESC
    `).all(req.params.freelancerId)
    res.json(tasks)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/generate', (req, res) => {
  try {
    const { freelancer_id, project_id, task_ids, created_by } = req.body
    
    const canSettleCheck = db.prepare('SELECT id_card_verified, agreement_status, risk_status FROM users WHERE id = ?').get(freelancer_id)
    if (!canSettleCheck.id_card_verified || canSettleCheck.agreement_status !== 'approved' || canSettleCheck.risk_status === 'blocked') {
      return res.status(400).json({ error: '该用户不符合结算条件，请检查实名、协议和风险状态' })
    }

    const taskIdList = task_ids.split(',').map(id => parseInt(id.trim()))
    const placeholders = taskIdList.map(() => '?').join(',')
    
    const tasks = db.prepare(`
      SELECT * FROM tasks WHERE id IN (${placeholders}) AND acceptance_status = 'approved' AND settled = 0
    `).all(...taskIdList)

    if (tasks.length === 0) {
      return res.status(400).json({ error: '没有可结算的任务' })
    }

    const total_task_amount = tasks.reduce((sum, t) => sum + t.total_amount, 0)
    
    const rules = db.prepare('SELECT * FROM settlement_rules WHERE is_active = 1').all()
    
    let platform_fee = 0
    let personal_tax = calculateTax(total_task_amount)
    let subsidy = 0
    let deduction = 0

    for (const rule of rules) {
      const value = rule.calculation_type === 'percentage' ? total_task_amount * rule.value / 100 : rule.value
      switch (rule.rule_type) {
        case 'platform_fee':
          platform_fee = value
          break
        case 'tax':
          personal_tax = Math.max(personal_tax, value)
          break
        case 'subsidy':
          subsidy = value
          break
        case 'deduction':
          deduction = value
          break
      }
    }

    const final_amount = total_task_amount - platform_fee - personal_tax + subsidy - deduction

    const settlement_no = 'SET' + Date.now()

    const result = db.prepare(`
      INSERT INTO settlements (settlement_no, freelancer_id, project_id, task_ids, total_task_amount,
        platform_fee, personal_tax, subsidy, deduction, final_amount, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(settlement_no, freelancer_id, project_id, task_ids, total_task_amount,
      platform_fee, personal_tax, subsidy, deduction, final_amount, created_by || 1)

    db.prepare(`UPDATE tasks SET settled = 1 WHERE id IN (${placeholders})`).run(...taskIdList)

    res.json({ id: result.lastInsertRowid, settlement_no, total_task_amount, platform_fee, personal_tax, subsidy, deduction, final_amount })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/confirm', (req, res) => {
  try {
    db.prepare("UPDATE settlements SET status = 'confirmed', updated_at = strftime('%s', 'now') WHERE id = ?").run(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/adjust', (req, res) => {
  try {
    const { platform_fee, personal_tax, subsidy, deduction, operator_id } = req.body
    const oldSettlement = db.prepare('SELECT * FROM settlements WHERE id = ?').get(req.params.id)
    const final_amount = oldSettlement.total_task_amount - platform_fee - personal_tax + subsidy - deduction
    
    const adjustmentLog = JSON.stringify({
      old: { platform_fee: oldSettlement.platform_fee, personal_tax: oldSettlement.personal_tax, subsidy: oldSettlement.subsidy, deduction: oldSettlement.deduction },
      new: { platform_fee, personal_tax, subsidy, deduction },
      operator: operator_id || 1,
      time: Date.now()
    })

    db.prepare(`
      UPDATE settlements SET platform_fee = ?, personal_tax = ?, subsidy = ?, deduction = ?, final_amount = ?,
        amount_adjustment_log = COALESCE(amount_adjustment_log || ';', '') || ?, updated_at = strftime('%s', 'now')
      WHERE id = ?
    `).run(platform_fee, personal_tax, subsidy, deduction, final_amount, adjustmentLog, req.params.id)

    res.json({ success: true, final_amount })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', (req, res) => {
  try {
    const settlement = db.prepare('SELECT * FROM settlements WHERE id = ?').get(req.params.id)
    if (settlement && settlement.amount_adjustment_log) {
      settlement.adjustment_logs = settlement.amount_adjustment_log.split(';').filter(l => l).map(l => JSON.parse(l))
    }
    res.json(settlement)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
