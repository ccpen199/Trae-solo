const express = require('express');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const generateOrderNo = () => {
  const date = new Date();
  const timestamp = date.getTime().toString().slice(-10);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PAY${timestamp}${random}`;
};

router.post('/recharge', authenticateToken, (req, res) => {
  const { account_id, amount, payment_method, is_agent, agent_relation, payee_name } = req.body;

  if (!account_id || !amount || amount <= 0) {
    return res.status(400).json({ error: '参数错误' });
  }

  db.get('SELECT id, account_name, account_number FROM accounts WHERE id = ? AND user_id = ?', [account_id, req.user.id], (err, account) => {
    if (err || !account) {
      return res.status(404).json({ error: '户号不存在' });
    }

    const orderNo = generateOrderNo();

    db.run(
      'INSERT INTO payment_records (account_id, user_id, amount, payment_method, order_no, status, payer_name, payee_name, is_agent, agent_relation, payment_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [account_id, req.user.id, amount, payment_method || 'alipay', orderNo, 'success', req.user.username, payee_name || account.account_name, is_agent ? 1 : 0, agent_relation || '', 'recharge'],
      function (err) {
        if (err) {
          return res.status(500).json({ error: '支付失败' });
        }

        db.run('UPDATE accounts SET balance = balance + ?, arrears = MAX(0, arrears - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [amount, amount, account_id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: '更新余额失败' });
            }

            const pointsEarned = Math.floor(amount);
            db.run('UPDATE users SET points = points + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [pointsEarned, req.user.id],
              (err) => {
                res.json({
                  order_no: orderNo,
                  amount: amount,
                  points_earned: pointsEarned,
                  status: 'success',
                  payment_method: payment_method || 'alipay',
                  account_number: account.account_number,
                  account_name: account.account_name,
                  is_agent: is_agent ? 1 : 0,
                  agent_relation: agent_relation || '',
                  payer_name: req.user.username,
                  payee_name: payee_name || account.account_name,
                  message: '充值成功'
                });
              }
            );
          }
        );
      }
    );
  });
});

router.get('/records', authenticateToken, (req, res) => {
  const { page = 1, page_size = 20, type, account_id, is_agent, agent_relation } = req.query;
  const offset = (page - 1) * page_size;

  let sql = 'SELECT pr.*, a.account_number, a.account_name FROM payment_records pr LEFT JOIN accounts a ON pr.account_id = a.id WHERE pr.user_id = ?';
  let params = [req.user.id];
  let countSql = 'SELECT COUNT(*) as total FROM payment_records WHERE user_id = ?';
  let countParams = [req.user.id];

  if (type) {
    sql += ' AND pr.payment_type = ?';
    params.push(type);
    countSql += ' AND payment_type = ?';
    countParams.push(type);
  }

  if (account_id) {
    sql += ' AND pr.account_id = ?';
    params.push(account_id);
    countSql += ' AND account_id = ?';
    countParams.push(account_id);
  }

  if (is_agent !== undefined && is_agent !== '') {
    sql += ' AND pr.is_agent = ?';
    params.push(is_agent === '1' ? 1 : 0);
    countSql += ' AND is_agent = ?';
    countParams.push(is_agent === '1' ? 1 : 0);
  }

  if (agent_relation) {
    sql += ' AND pr.agent_relation = ?';
    params.push(agent_relation);
    countSql += ' AND agent_relation = ?';
    countParams.push(agent_relation);
  }

  sql += ' ORDER BY pr.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), offset);

  db.all(sql, params, (err, records) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }

    db.get(countSql, countParams, (err, count) => {
      db.get('SELECT SUM(amount) as total_amount FROM payment_records WHERE user_id = ?', [req.user.id], (err, stats) => {
        db.get('SELECT SUM(amount) as agent_amount FROM payment_records WHERE user_id = ? AND is_agent = 1', [req.user.id], (err, agentStats) => {
          res.json({
            records: records.map(r => ({
              ...r,
              is_agent: r.is_agent === 1,
              category: r.is_agent === 1 ? 'agent' : (r.payment_type === 'recharge' ? 'self' : 'other'),
              invoice_status: r.invoice_status || 'not_issued',
              verification_code: r.verification_code || null
            })),
            total: count.total,
            page: parseInt(page),
            page_size: parseInt(page_size),
            summary: {
              total_amount: stats?.total_amount || 0,
              total_count: count.total,
              agent_amount: agentStats?.agent_amount || 0,
              agent_count: records.filter(r => r.is_agent === 1).length
            }
          });
        });
      });
    });
  });
});

router.post('/:id/invoice', authenticateToken, (req, res) => {
  const recordId = req.params.id;

  db.get('SELECT * FROM payment_records WHERE id = ? AND user_id = ?', [recordId, req.user.id], (err, record) => {
    if (err || !record) {
      return res.status(404).json({ error: '缴费记录不存在' });
    }

    const invoiceNo = 'INV' + Date.now();
    const verificationCode = 'VER' + Date.now();

    db.run(
      'UPDATE payment_records SET invoice_status = "issued", invoice_no = ?, verification_code = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [invoiceNo, verificationCode, recordId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: '开具发票失败' });
        }

        db.run(
          'INSERT INTO payment_vouchers (user_id, payment_id, voucher_no, amount, payment_method, invoice_status, invoice_no, verification_code, arrival_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [req.user.id, recordId, 'PVD' + Date.now(), record.amount, record.payment_method, 'issued', invoiceNo, verificationCode, 'confirmed']
        );

        res.json({
          message: '电子发票开具成功',
          invoice_no: invoiceNo,
          verification_code: verificationCode,
          invoice_url: `/api/payment/invoice/${invoiceNo}`,
          record_id: recordId
        });
      }
    );
  });
});

router.get('/:id/voucher', authenticateToken, (req, res) => {
  const recordId = req.params.id;

  db.get(`
    SELECT pr.*, a.account_number, a.account_name, pv.voucher_no, pv.invoice_status, pv.invoice_no, pv.verification_code, pv.arrival_status
    FROM payment_records pr
    LEFT JOIN accounts a ON pr.account_id = a.id
    LEFT JOIN payment_vouchers pv ON pr.id = pv.payment_id
    WHERE pr.id = ? AND pr.user_id = ?
  `, [recordId, req.user.id], (err, record) => {
    if (err || !record) {
      return res.status(404).json({ error: '缴费记录不存在' });
    }

    res.json({
      ...record,
      is_agent: record.is_agent === 1
    });
  });
});

router.get('/stats', authenticateToken, (req, res) => {
  db.get('SELECT COUNT(*) as total_count, SUM(amount) as total_amount FROM payment_records WHERE user_id = ?', [req.user.id], (err, stats) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    res.json(stats);
  });
});

module.exports = router;
