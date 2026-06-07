const express = require('express');
const { db } = require('../utils/database');
const { authenticateToken } = require('../middleware/auth');
const { getServiceUserId } = require('../utils/accountContext');

const router = express.Router();

function ensureDemoAutoPayAgreement(userId) {
  if (!userId) return null;
  const existing = db.prepare('SELECT * FROM auto_pay_agreements WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(userId);
  if (existing) return existing;

  const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);
  const user = db.prepare('SELECT real_name, id_card FROM users WHERE id = ?').get(userId);
  const bankAccount = profile?.bank_account || '622202********1234';

  const result = db.prepare(`INSERT INTO auto_pay_agreements 
    (user_id, bank_name, bank_account, account_name, id_card, monthly_limit, status, signed_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', date('now','-30 days'))`).run(
    userId,
    '中国工商银行',
    bankAccount,
    user?.real_name || '测试用户',
    user?.id_card || '370101199004040004',
    500
  );

  db.prepare('UPDATE user_profiles SET auto_pay = 1, bank_account = ? WHERE user_id = ?').run(bankAccount, userId);
  return db.prepare('SELECT * FROM auto_pay_agreements WHERE id = ?').get(result.lastInsertRowid);
}

router.get('/my-bills', authenticateToken, (req, res) => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE b.user_id = ?';
    const serviceUserId = getServiceUserId(req);
    const params = [serviceUserId];

    if (status) {
      whereClause += ' AND b.status = ?';
      params.push(status);
    }

    const bills = db.prepare(`
      SELECT b.*, mr.reading_value, mr.reading_date 
      FROM bills b 
      LEFT JOIN meter_readings mr ON b.reading_id = mr.id 
      ${whereClause} 
      ORDER BY b.billing_cycle DESC, b.id DESC 
      LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM bills b ${whereClause}`).get(...params).count;

    res.json({ list: bills, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    console.error('获取账单错误:', err);
    res.status(500).json({ error: '获取账单失败' });
  }
});

router.get('/unpaid-summary', authenticateToken, (req, res) => {
  try {
    const unpaid = db.prepare(`
      SELECT COUNT(*) as count, SUM(pay_amount) as total 
      FROM bills 
      WHERE user_id = ? AND status IN ('unpaid', 'partial', 'overdue')`).get(getServiceUserId(req));

    const latestBill = db.prepare(`
      SELECT * FROM bills 
      WHERE user_id = ? AND status IN ('unpaid', 'partial', 'overdue') 
      ORDER BY billing_cycle DESC LIMIT 1`).get(getServiceUserId(req));

    res.json({
      unpaid_count: unpaid.count || 0,
      unpaid_total: unpaid.total || 0,
      latest_bill: latestBill
    });
  } catch (err) {
    res.status(500).json({ error: '获取账单摘要失败' });
  }
});

router.post('/:id/pay', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { pay_method, pay_amount } = req.body;

    const serviceUserId = getServiceUserId(req);
    const bill = db.prepare('SELECT * FROM bills WHERE id = ? AND user_id = ?').get(id, serviceUserId);
    if (!bill) {
      return res.status(404).json({ error: '账单不存在' });
    }
    if (bill.status === 'paid') {
      return res.status(400).json({ error: '账单已支付' });
    }

    const actualPay = pay_amount || bill.pay_amount;

    db.prepare(`UPDATE bills SET 
      status = 'paid', 
      pay_method = ?, 
      pay_amount = ?, 
      pay_time = CURRENT_TIMESTAMP 
      WHERE id = ?`).run(pay_method || 'online', actualPay, id);

    db.prepare(`INSERT INTO notification_logs (user_id, type, title, content) 
      VALUES (?, 'payment', '缴费成功', ?)`).run(serviceUserId, 
      `您${bill.billing_cycle}账单已支付成功，金额¥${actualPay.toFixed(2)}元`);

    res.json({ message: '支付成功', bill_id: id, pay_amount: actualPay });
  } catch (err) {
    console.error('支付错误:', err);
    res.status(500).json({ error: '支付失败' });
  }
});

router.get('/auto-pay/status', authenticateToken, (req, res) => {
  try {
    const serviceUserId = getServiceUserId(req);
    const agreement = ensureDemoAutoPayAgreement(serviceUserId);
    const agreements = db.prepare('SELECT * FROM auto_pay_agreements WHERE user_id = ? ORDER BY signed_at DESC, id DESC').all(serviceUserId);
    res.json({ has_agreement: !!agreement, agreement, agreements });
  } catch (err) {
    res.status(500).json({ error: '获取代扣状态失败' });
  }
});

router.post('/auto-pay/sign', authenticateToken, (req, res) => {
  try {
    const { bank_name, bank_account, account_name, id_card, monthly_limit } = req.body;

    if (!bank_name || !bank_account || !account_name || !id_card) {
      return res.status(400).json({ error: '请填写完整的签约信息' });
    }

    const serviceUserId = getServiceUserId(req);
    const existing = db.prepare('SELECT * FROM auto_pay_agreements WHERE user_id = ?').get(serviceUserId);
    if (existing && existing.status === 'active') {
      return res.status(400).json({ error: '已有生效的代扣协议' });
    }

    const tx = db.transaction(() => {
      if (existing) {
        db.prepare('UPDATE auto_pay_agreements SET status = ? WHERE id = ?').run('cancelled', existing.id);
      }

      const result = db.prepare(`INSERT INTO auto_pay_agreements 
        (user_id, bank_name, bank_account, account_name, id_card, monthly_limit, status, signed_at)
        VALUES (?, ?, ?, ?, ?, ?, 'active', CURRENT_DATE)`).run(
        serviceUserId, bank_name, bank_account, account_name, id_card, monthly_limit || null
      );

      db.prepare('UPDATE user_profiles SET auto_pay = 1, bank_account = ? WHERE user_id = ?').run(bank_account, serviceUserId);

      return result.lastInsertRowid;
    });

    const agreementId = tx();

    db.prepare(`INSERT INTO notification_logs (user_id, type, title, content) 
      VALUES (?, 'auto_pay', '代扣签约成功', ?)`).run(serviceUserId, 
      `您已成功签约${bank_name}代扣服务，每月将自动扣除燃气费`);

    res.json({ message: '代扣签约成功', agreement_id: agreementId });
  } catch (err) {
    console.error('代扣签约错误:', err);
    res.status(500).json({ error: '签约失败' });
  }
});

router.post('/auto-pay/cancel', authenticateToken, (req, res) => {
  try {
    const serviceUserId = getServiceUserId(req);
    const agreement = db.prepare('SELECT * FROM auto_pay_agreements WHERE user_id = ? AND status = ?').get(serviceUserId, 'active');
    if (!agreement) {
      return res.status(404).json({ error: '未找到生效的代扣协议' });
    }

    const tx = db.transaction(() => {
      db.prepare(`UPDATE auto_pay_agreements SET status = 'cancelled', cancelled_at = CURRENT_DATE WHERE id = ?`).run(agreement.id);
      db.prepare('UPDATE user_profiles SET auto_pay = 0 WHERE user_id = ?').run(serviceUserId);
    });

    tx();

    res.json({ message: '代扣协议已取消' });
  } catch (err) {
    console.error('取消代扣错误:', err);
    res.status(500).json({ error: '取消失败' });
  }
});

router.get('/payment-history', authenticateToken, (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const payments = db.prepare(`
      SELECT id, billing_cycle, pay_amount, pay_method, pay_time, gas_usage 
      FROM bills 
      WHERE user_id = ? AND status = 'paid' 
      ORDER BY pay_time DESC 
      LIMIT ? OFFSET ?`).all(getServiceUserId(req), parseInt(pageSize), offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM bills WHERE user_id = ? AND status = ?').get(getServiceUserId(req), 'paid').count;

    res.json({ list: payments, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    res.status(500).json({ error: '获取缴费记录失败' });
  }
});

module.exports = router;
