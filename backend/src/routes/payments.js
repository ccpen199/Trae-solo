const express = require('express')
const router = express.Router()
const db = require('../utils/db')

router.get('/batches', (req, res) => {
  try {
    const batches = db.prepare(`
      SELECT pb.*, u.name as creator_name
      FROM payment_batches pb
      LEFT JOIN users u ON pb.created_by = u.id
      ORDER BY pb.created_at DESC
    `).all()
    res.json(batches)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/batches', (req, res) => {
  try {
    const { batch_name, settlement_ids, created_by } = req.body
    const settlementIdList = settlement_ids.split(',').map(id => parseInt(id.trim()))
    
    const settlements = db.prepare(`
      SELECT s.*, u.name as account_name, u.bank_account, u.bank_name
      FROM settlements s
      LEFT JOIN users u ON s.freelancer_id = u.id
      WHERE s.id IN (${settlementIdList.map(() => '?').join(',')}) AND s.status = 'confirmed'
    `).all(...settlementIdList)

    if (settlements.length === 0) {
      return res.status(400).json({ error: '没有可支付的结算单' })
    }

    const batch_no = 'PAY' + Date.now()
    const total_amount = settlements.reduce((sum, s) => sum + s.final_amount, 0)

    const batchResult = db.prepare(`
      INSERT INTO payment_batches (batch_no, batch_name, total_count, total_amount, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(batch_no, batch_name, settlements.length, total_amount, created_by || 1)

    const batchId = batchResult.lastInsertRowid

    for (const s of settlements) {
      db.prepare(`
        INSERT INTO payments (payment_batch_id, settlement_id, freelancer_id, amount)
        VALUES (?, ?, ?, ?)
      `).run(batchId, s.id, s.freelancer_id, s.final_amount)
      
      db.prepare("UPDATE settlements SET status = 'paid' WHERE id = ?").run(s.id)
    }

    res.json({ id: batchId, batch_no, total_count: settlements.length, total_amount })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/', (req, res) => {
  try {
    const { batch_id, status } = req.query
    let sql = `
      SELECT p.*, pb.batch_no, u.name as freelancer_name, s.settlement_no
      FROM payments p
      LEFT JOIN payment_batches pb ON p.payment_batch_id = pb.id
      LEFT JOIN users u ON p.freelancer_id = u.id
      LEFT JOIN settlements s ON p.settlement_id = s.id
      WHERE 1=1
    `
    const params = []
    if (batch_id) {
      sql += ' AND p.payment_batch_id = ?'
      params.push(batch_id)
    }
    if (status) {
      sql += ' AND p.status = ?'
      params.push(status)
    }
    sql += ' ORDER BY p.created_at DESC'
    const payments = db.prepare(sql).all(...params)
    res.json(payments)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/process', (req, res) => {
  try {
    const { success, fail_reason } = req.body
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id)
    
    if (success) {
      db.prepare(`
        UPDATE payments SET status = 'success', paid_at = strftime('%s', 'now'), bank_serial_no = ?
        WHERE id = ?
      `).run('BANK' + Date.now(), req.params.id)
      
      db.prepare(`
        UPDATE payment_batches SET success_count = success_count + 1, success_amount = success_amount + ?
        WHERE id = ?
      `).run(payment.amount, payment.payment_batch_id)
    } else {
      db.prepare(`
        UPDATE payments SET status = 'failed', fail_reason = ?, retry_count = retry_count + 1
        WHERE id = ?
      `).run(fail_reason || '银行卡失效', req.params.id)
      
      db.prepare(`
        UPDATE payment_batches SET fail_count = fail_count + 1
        WHERE id = ?
      `).run(payment.payment_batch_id)
    }

    const batch = db.prepare('SELECT total_count, success_count, fail_count FROM payment_batches WHERE id = ?').get(payment.payment_batch_id)
    let batchStatus = 'processing'
    if (batch.success_count === batch.total_count) {
      batchStatus = 'success'
    } else if (batch.success_count > 0 || batch.fail_count > 0) {
      batchStatus = 'partial_success'
    }
    db.prepare('UPDATE payment_batches SET status = ? WHERE id = ?').run(batchStatus, payment.payment_batch_id)

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/retry', (req, res) => {
  try {
    db.prepare("UPDATE payments SET status = 'retrying', retry_count = retry_count + 1 WHERE id = ?").run(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
