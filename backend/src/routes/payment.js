import express from 'express'
import db from '../utils/db.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { generateTransactionNo } from '../utils/pricing.js'

const router = express.Router()

router.get('/wallet', authenticate, (req, res) => {
  const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(req.user.id)
  
  const recentTransactions = db.prepare(`
    SELECT * FROM transactions 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 20
  `).all(req.user.id)
  
  res.json({ code: 200, data: { wallet, transactions: recentTransactions } })
})

router.post('/recharge', authenticate, (req, res) => {
  const { amount } = req.body
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ code: 400, message: '请输入有效的充值金额' })
  }
  
  const tx = db.transaction(() => {
    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(req.user.id)
    const newBalance = wallet.balance + amount
    
    db.prepare(`
      UPDATE wallets 
      SET balance = ?, total_income = total_income + ?, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = ?
    `).run(newBalance, amount, req.user.id)
    
    const txNo = generateTransactionNo('RE')
    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, status, transaction_no, remark)
      VALUES (?, 'recharge', ?, ?, ?, 'completed', ?, '在线充值')
    `).run(req.user.id, amount, wallet.balance, newBalance, txNo)
  })
  
  try {
    tx()
    res.json({ code: 200, message: '充值成功' })
  } catch (err) {
    res.status(500).json({ code: 500, message: '充值失败' })
  }
})

router.post('/escrow-freeze', authenticate, requireRole('shipper'), (req, res) => {
  const { waybill_id } = req.body
  
  if (!waybill_id) {
    return res.status(400).json({ code: 400, message: '缺少运单ID' })
  }
  
  const waybill = db.prepare('SELECT * FROM waybills WHERE id = ? AND shipper_id = ?').get(waybill_id, req.user.id)
  if (!waybill) {
    return res.status(404).json({ code: 404, message: '运单不存在' })
  }
  
  const existingEscrow = db.prepare('SELECT id FROM escrow_funds WHERE waybill_id = ?').get(waybill_id)
  if (existingEscrow) {
    return res.status(400).json({ code: 400, message: '该运单资金已冻结' })
  }
  
  const amount = waybill.agreed_price
  
  const tx = db.transaction(() => {
    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(req.user.id)
    
    if (wallet.balance < amount) {
      throw new Error('余额不足，请先充值')
    }
    
    db.prepare(`
      UPDATE wallets 
      SET balance = balance - ?, 
          frozen_balance = frozen_balance + ?,
          updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = ?
    `).run(amount, amount, req.user.id)
    
    const txNo = generateTransactionNo('FR')
    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, status, transaction_no, waybill_id, remark)
      VALUES (?, 'payment', ?, ?, ?, 'completed', ?, ?, '运费担保冻结')
    `).run(req.user.id, amount, wallet.balance, wallet.balance - amount, txNo, waybill_id)
    
    db.prepare(`
      INSERT INTO escrow_funds (waybill_id, shipper_id, amount, status, transaction_no)
      VALUES (?, ?, ?, 'frozen', ?)
    `).run(waybill_id, req.user.id, amount, txNo)
  })
  
  try {
    tx()
    res.json({ code: 200, message: '担保资金已冻结' })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message || '资金冻结失败' })
  }
})

router.post('/escrow-release', authenticate, requireRole('shipper'), (req, res) => {
  const { waybill_id } = req.body
  
  if (!waybill_id) {
    return res.status(400).json({ code: 400, message: '缺少运单ID' })
  }
  
  const waybill = db.prepare('SELECT * FROM waybills WHERE id = ? AND shipper_id = ?').get(waybill_id, req.user.id)
  if (!waybill) {
    return res.status(404).json({ code: 404, message: '运单不存在' })
  }
  
  if (waybill.status !== 'completed') {
    return res.status(400).json({ code: 400, message: '运单未完成，无法解冻资金' })
  }
  
  const escrow = db.prepare('SELECT * FROM escrow_funds WHERE waybill_id = ? AND status = ?').get(waybill_id, 'frozen')
  if (!escrow) {
    return res.status(400).json({ code: 400, message: '没有可解冻的担保资金' })
  }
  
  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE escrow_funds 
      SET status = 'released', released_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(escrow.id)
    
    const shipperWallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(req.user.id)
    db.prepare(`
      UPDATE wallets 
      SET frozen_balance = frozen_balance - ?, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = ?
    `).run(escrow.amount, req.user.id)
    
    const platformTxNo = generateTransactionNo('CM')
    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, status, transaction_no, waybill_id, remark)
      VALUES (1, 'commission', ?, 0, 0, 'completed', ?, ?, '平台佣金收入')
    `).run(waybill.platform_commission, platformTxNo, waybill_id)
    
    const insuranceTxNo = generateTransactionNo('IN')
    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, status, transaction_no, waybill_id, remark)
      VALUES (1, 'insurance', ?, 0, 0, 'completed', ?, ?, '保险费收入')
    `).run(waybill.insurance_fee, insuranceTxNo, waybill_id)
    
    const driverWallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(waybill.driver_id)
    const driverNewBalance = driverWallet.balance + waybill.driver_receivable
    
    db.prepare(`
      UPDATE wallets 
      SET balance = ?, total_income = total_income + ?, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = ?
    `).run(driverNewBalance, waybill.driver_receivable, waybill.driver_id)
    
    const driverTxNo = generateTransactionNo('ST')
    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, status, transaction_no, waybill_id, remark)
      VALUES (?, 'settlement', ?, ?, ?, 'completed', ?, ?, '运费结算')
    `).run(waybill.driver_id, waybill.driver_receivable, driverWallet.balance, driverNewBalance, driverTxNo, waybill_id)
  })
  
  try {
    tx()
    res.json({ code: 200, message: '资金已解冻并完成分账' })
  } catch (err) {
    res.status(500).json({ code: 500, message: '资金解冻失败', error: err.message })
  }
})

router.post('/withdraw', authenticate, (req, res) => {
  const { amount, account_no, account_name, bank_name } = req.body
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ code: 400, message: '请输入有效的提现金额' })
  }
  
  if (!account_no || !account_name) {
    return res.status(400).json({ code: 400, message: '请填写完整的提现账户信息' })
  }
  
  const tx = db.transaction(() => {
    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(req.user.id)
    
    if (wallet.balance < amount) {
      throw new Error('余额不足')
    }
    
    const newBalance = wallet.balance - amount
    db.prepare(`
      UPDATE wallets 
      SET balance = ?, total_expend = total_expend + ?, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = ?
    `).run(newBalance, amount, req.user.id)
    
    const txNo = generateTransactionNo('WD')
    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, status, transaction_no, remark)
      VALUES (?, 'withdraw', ?, ?, ?, 'completed', ?, ?)
    `).run(req.user.id, amount, wallet.balance, newBalance, txNo, `提现至${bank_name || '银行'} ${account_no}`)
  })
  
  try {
    tx()
    res.json({ code: 200, message: '提现申请已提交，T+0到账' })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message || '提现失败' })
  }
})

router.get('/transactions', authenticate, (req, res) => {
  const { type, page = 1, pageSize = 20 } = req.query
  const offset = (page - 1) * pageSize
  
  let query = 'SELECT * FROM transactions WHERE user_id = ?'
  let params = [req.user.id]
  
  if (type) {
    query += ' AND type = ?'
    params.push(type)
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(pageSize), offset)
  
  const list = db.prepare(query).all(...params)
  
  let countQuery = 'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?'
  let countParams = [req.user.id]
  if (type) {
    countQuery += ' AND type = ?'
    countParams.push(type)
  }
  const { total } = db.prepare(countQuery).get(...countParams)
  
  res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } })
})

router.get('/reconciliation', authenticate, requireRole('admin'), (req, res) => {
  const { start_date, end_date } = req.query
  
  let dateFilter = ''
  let params = []
  
  if (start_date) {
    dateFilter += ' AND t.created_at >= ?'
    params.push(start_date)
  }
  if (end_date) {
    dateFilter += ' AND t.created_at <= ?'
    params.push(end_date + ' 23:59:59')
  }
  
  const summary = db.prepare(`
    SELECT 
      SUM(CASE WHEN t.type = 'recharge' THEN t.amount ELSE 0 END) as total_recharge,
      SUM(CASE WHEN t.type = 'commission' THEN t.amount ELSE 0 END) as total_commission,
      SUM(CASE WHEN t.type = 'insurance' THEN t.amount ELSE 0 END) as total_insurance,
      SUM(CASE WHEN t.type = 'withdraw' THEN t.amount ELSE 0 END) as total_withdraw,
      SUM(CASE WHEN t.type = 'settlement' THEN t.amount ELSE 0 END) as total_settlement,
      COUNT(*) as transaction_count
    FROM transactions t
    WHERE 1=1 ${dateFilter}
  `).get(...params)
  
  const dailyStats = db.prepare(`
    SELECT 
      DATE(t.created_at) as date,
      SUM(CASE WHEN t.type = 'recharge' THEN t.amount ELSE 0 END) as recharge,
      SUM(CASE WHEN t.type = 'commission' THEN t.amount ELSE 0 END) as commission,
      SUM(CASE WHEN t.type = 'insurance' THEN t.amount ELSE 0 END) as insurance,
      SUM(CASE WHEN t.type = 'withdraw' THEN t.amount ELSE 0 END) as withdraw,
      SUM(CASE WHEN t.type = 'settlement' THEN t.amount ELSE 0 END) as settlement
    FROM transactions t
    WHERE 1=1 ${dateFilter}
    GROUP BY DATE(t.created_at)
    ORDER BY date DESC
    LIMIT 30
  `).all(...params)
  
  res.json({ code: 200, data: { summary, dailyStats } })
})

router.get('/escrow-list', authenticate, requireRole('shipper'), (req, res) => {
  const list = db.prepare(`
    SELECT ef.*, w.waybill_no, cs.cargo_name, cs.start_city, cs.end_city,
      d.real_name as driver_name, w.status as waybill_status
    FROM escrow_funds ef
    LEFT JOIN waybills w ON ef.waybill_id = w.id
    LEFT JOIN cargo_sources cs ON w.cargo_id = cs.id
    LEFT JOIN users d ON w.driver_id = d.id
    WHERE ef.shipper_id = ?
    ORDER BY ef.frozen_at DESC
  `).all(req.user.id)
  
  res.json({ code: 200, data: list })
})

export default router
