const express = require('express');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/products', (req, res) => {
  db.all('SELECT * FROM financial_products WHERE status = "active" ORDER BY risk_level ASC, id ASC',
    (err, products) => {
      if (err) {
        return res.status(500).json({ error: '服务器错误' });
      }
      res.json(products);
    }
  );
});

router.post('/risk-assessment', authenticateToken, (req, res) => {
  const { answers } = req.body;

  let score = 0;
  answers.forEach(a => {
    score += a.score || 0;
  });

  let riskLevel = 1;
  if (score >= 80) riskLevel = 3;
  else if (score >= 50) riskLevel = 2;

  db.run('UPDATE users SET risk_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [riskLevel, req.user.id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: '评估失败' });
      }
      res.json({ risk_level: riskLevel, message: '风险评估完成' });
    }
  );
});

router.post('/invest', authenticateToken, (req, res) => {
  const { product_id, amount } = req.body;

  if (!product_id || !amount || amount <= 0) {
    return res.status(400).json({ error: '参数错误' });
  }

  db.get('SELECT * FROM financial_products WHERE id = ? AND status = "active"', [product_id], (err, product) => {
    if (err || !product) {
      return res.status(404).json({ error: '产品不存在' });
    }

    if (amount < product.min_amount) {
      return res.status(400).json({ error: `最低起购金额：${product.min_amount}元` });
    }

    if (product.max_amount && amount > product.max_amount) {
      return res.status(400).json({ error: `最高购买金额：${product.max_amount}元` });
    }

    db.get('SELECT risk_level FROM users WHERE id = ?', [req.user.id], (err, user) => {
      if (err || !user) {
        return res.status(500).json({ error: '服务器错误' });
      }

      if (user.risk_level < product.risk_level) {
        return res.status(400).json({ error: '风险等级不匹配，请先完成风险测评' });
      }

      const expectedIncome = product.term_days
        ? (amount * product.expected_yield / 100 * product.term_days / 365).toFixed(2)
        : null;

      db.run(
        'INSERT INTO investment_records (user_id, product_id, amount, expected_income, status) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, product_id, amount, expectedIncome, 'holding'],
        function (err) {
          if (err) {
            return res.status(500).json({ error: '申购失败' });
          }

          res.json({
            id: this.lastID,
            amount,
            expected_income: expectedIncome,
            message: '申购成功'
          });
        }
      );
    });
  });
});

router.get('/investments', authenticateToken, (req, res) => {
  const { status } = req.query;

  let sql = `SELECT ir.*, fp.name, fp.expected_yield, fp.term_days, fp.risk_level 
             FROM investment_records ir 
             LEFT JOIN financial_products fp ON ir.product_id = fp.id 
             WHERE ir.user_id = ?`;
  let params = [req.user.id];

  if (status) {
    sql += ' AND ir.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY ir.purchase_date DESC';

  db.all(sql, params, (err, records) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    res.json(records);
  });
});

router.post('/redeem/:id', authenticateToken, (req, res) => {
  const recordId = req.params.id;

  db.get('SELECT * FROM investment_records WHERE id = ? AND user_id = ? AND status = "holding"',
    [recordId, req.user.id],
    (err, record) => {
      if (err || !record) {
        return res.status(404).json({ error: '投资记录不存在或已赎回' });
      }

      db.run(
        'UPDATE investment_records SET status = "redeemed", actual_income = expected_income, redeem_date = CURRENT_TIMESTAMP WHERE id = ?',
        [recordId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: '赎回失败' });
          }
          res.json({ message: '赎回成功' });
        }
      );
    }
  );
});

module.exports = router;
