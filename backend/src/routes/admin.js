const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM admin_users WHERE username = ?', [username], (err, admin) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }

    if (!admin) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    if (!bcrypt.compareSync(password, admin.password)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, isAdmin: true, role: admin.role },
      process.env.JWT_SECRET || 'state-grid-secret-key-2024',
      { expiresIn: '12h' }
    );

    const { password: _, ...adminWithoutPassword } = admin;
    res.json({ token, admin: adminWithoutPassword });
  });
});

router.get('/stats', authenticateAdmin, (req, res) => {
  db.serialize(() => {
    db.get('SELECT COUNT(*) as user_count FROM users', (err, userStats) => {
      db.get('SELECT COUNT(*) as account_count FROM accounts', (err, accountStats) => {
        db.get('SELECT SUM(amount) as total_payment, COUNT(*) as payment_count FROM payment_records', (err, paymentStats) => {
          db.get('SELECT COUNT(*) as exchange_count FROM exchange_records', (err, exchangeStats) => {
            res.json({
              user_count: userStats.user_count,
              account_count: accountStats.account_count,
              total_payment: paymentStats.total_payment || 0,
              payment_count: paymentStats.payment_count,
              exchange_count: exchangeStats.exchange_count
            });
          });
        });
      });
    });
  });
});

router.get('/users', authenticateAdmin, (req, res) => {
  const { page = 1, page_size = 20 } = req.query;
  const offset = (page - 1) * page_size;

  db.all('SELECT id, username, phone, real_name, points, user_type, province, city, risk_level, created_at FROM users ORDER BY id DESC LIMIT ? OFFSET ?',
    [parseInt(page_size), offset],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: '服务器错误' });
      }

      db.get('SELECT COUNT(*) as total FROM users', (err, count) => {
        res.json({
          users,
          total: count.total,
          page: parseInt(page),
          page_size: parseInt(page_size)
        });
      });
    }
  );
});

router.get('/payment-records', authenticateAdmin, (req, res) => {
  const { page = 1, page_size = 20 } = req.query;
  const offset = (page - 1) * page_size;

  db.all(`SELECT pr.*, u.username, a.account_number, a.account_name 
          FROM payment_records pr 
          LEFT JOIN users u ON pr.user_id = u.id 
          LEFT JOIN accounts a ON pr.account_id = a.id 
          ORDER BY pr.created_at DESC LIMIT ? OFFSET ?`,
    [parseInt(page_size), offset],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: '服务器错误' });
      }

      db.get('SELECT COUNT(*) as total FROM payment_records', (err, count) => {
        res.json({
          records,
          total: count.total,
          page: parseInt(page),
          page_size: parseInt(page_size)
        });
      });
    }
  );
});

router.get('/exchange-records', authenticateAdmin, (req, res) => {
  const { page = 1, page_size = 20, risk_flag } = req.query;
  const offset = (page - 1) * page_size;

  let sql = `SELECT er.*, u.username, p.name as product_name 
             FROM exchange_records er 
             LEFT JOIN users u ON er.user_id = u.id 
             LEFT JOIN products p ON er.product_id = p.id`;
  let params = [];

  if (risk_flag !== undefined) {
    sql += ' WHERE er.risk_flag = ?';
    params.push(risk_flag);
  }

  sql += ' ORDER BY er.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), offset);

  db.all(sql, params, (err, records) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }

    db.get('SELECT COUNT(*) as total FROM exchange_records', (err, count) => {
      res.json({
        records,
        total: count.total,
        page: parseInt(page),
        page_size: parseInt(page_size)
      });
    });
  });
});

router.post('/products', authenticateAdmin, (req, res) => {
  const { name, description, category, points, stock, daily_limit, user_level_limit } = req.body;

  db.run(
    'INSERT INTO products (name, description, category, points, stock, daily_limit, user_level_limit) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, description, category, points, stock, daily_limit, user_level_limit],
    function (err) {
      if (err) {
        return res.status(500).json({ error: '创建失败' });
      }
      res.json({ id: this.lastID, message: '创建成功' });
    }
  );
});

router.put('/products/:id', authenticateAdmin, (req, res) => {
  const { name, description, category, points, stock, daily_limit, user_level_limit, status } = req.body;

  db.run(
    'UPDATE products SET name = ?, description = ?, category = ?, points = ?, stock = ?, daily_limit = ?, user_level_limit = ?, status = ? WHERE id = ?',
    [name, description, category, points, stock, daily_limit, user_level_limit, status, req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: '更新失败' });
      }
      res.json({ message: '更新成功' });
    }
  );
});

router.post('/business-report', authenticateAdmin, (req, res) => {
  const { report_type, report_date, province, city, data_json } = req.body;

  db.run(
    'INSERT INTO business_reports (report_type, report_date, province, city, data_json) VALUES (?, ?, ?, ?, ?)',
    [report_type, report_date, province, city, JSON.stringify(data_json)],
    function (err) {
      if (err) {
        return res.status(500).json({ error: '报送失败' });
      }
      res.json({ id: this.lastID, message: '数据报送成功' });
    }
  );
});

router.get('/business-reports', authenticateAdmin, (req, res) => {
  db.all('SELECT * FROM business_reports ORDER BY report_date DESC LIMIT 100', (err, reports) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    res.json(reports.map(r => ({ ...r, data: JSON.parse(r.data_json) })));
  });
});

module.exports = router;
