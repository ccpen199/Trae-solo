const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/records', authMiddleware(['admin', 'operator']), (req, res) => {
  const db = req.app.get('db');
  const { type, status, userId, page = 1, pageSize = 20 } = req.query;

  let sql = `
    SELECT r.*, u.username as user_name, u.nickname as user_nickname,
           h.username as handler_name
    FROM risk_records r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN users h ON r.handler_id = h.id
    WHERE 1=1
  `;
  let countSql = 'SELECT COUNT(*) as total FROM risk_records r WHERE 1=1';
  const params = [];

  if (type) {
    sql += ' AND r.type = ?';
    countSql += ' AND r.type = ?';
    params.push(type);
  }
  if (status) {
    sql += ' AND r.status = ?';
    countSql += ' AND r.status = ?';
    params.push(status);
  }
  if (userId) {
    sql += ' AND r.user_id = ?';
    countSql += ' AND r.user_id = ?';
    params.push(userId);
  }

  sql += ' ORDER BY r.id DESC LIMIT ? OFFSET ?';
  const queryParams = [...params, Number(pageSize), (Number(page) - 1) * Number(pageSize)];

  const records = db.prepare(sql).all(...queryParams);
  const { total } = db.prepare(countSql).get(...params);

  res.json({ items: records, total, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/detect', authMiddleware(), (req, res) => {
  const db = req.app.get('db');
  const { type, userId, orderId, amount, reason } = req.body;

  const result = db.prepare(`
    INSERT INTO risk_records (type, user_id, order_id, amount, reason)
    VALUES (?, ?, ?, ?, ?)
  `).run(type, userId, orderId, amount, reason);

  res.json({ id: result.lastInsertRowid, success: true });
});

router.post('/handle/:id', authMiddleware(['admin', 'operator']), (req, res) => {
  const { status, handleRemark, action } = req.body;
  const db = req.app.get('db');
  const handlerId = req.user.id;

  const record = db.prepare('SELECT * FROM risk_records WHERE id = ?').get(req.params.id);
  if (!record) {
    return res.status(404).json({ error: '风控记录不存在' });
  }

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE risk_records 
      SET status = ?, handler_id = ?, handle_remark = ?, handled_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, handlerId, handleRemark, req.params.id);

    if (action === 'freeze' && record.order_id) {
      const order = db.prepare('SELECT * FROM gift_orders WHERE id = ?').get(record.order_id);
      if (order) {
        db.prepare(`
          INSERT INTO frozen_income (user_id, amount, order_id, reason)
          VALUES (?, ?, ?, ?)
        `).run(order.receiver_id, order.total_amount * 0.5, record.order_id, handleRemark || '风控冻结');
      }
    }

    if (action === 'refund' && record.order_id) {
      const order = db.prepare('SELECT * FROM gift_orders WHERE id = ?').get(record.order_id);
      if (order) {
        db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(order.total_amount, order.user_id);
        db.prepare(`
          INSERT INTO balance_records (user_id, amount, type, order_id, remark, balance_after)
          VALUES (?, ?, 'refund', ?, ?, (SELECT balance FROM users WHERE id = ?))
        `).run(order.user_id, order.total_amount, order.id, '退款', order.user_id);
      }
    }

    if (action === 'unfreeze' && record.order_id) {
      db.prepare('DELETE FROM frozen_income WHERE order_id = ?').run(record.order_id);
    }
  });

  tx();
  res.json({ success: true });
});

router.get('/frozen-income', authMiddleware(['admin', 'operator', 'finance']), (req, res) => {
  const db = req.app.get('db');
  const { userId, status, page = 1, pageSize = 20 } = req.query;

  let sql = `
    SELECT f.*, u.username, u.nickname
    FROM frozen_income f
    LEFT JOIN users u ON f.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (userId) {
    sql += ' AND f.user_id = ?';
    params.push(userId);
  }
  if (status) {
    sql += ' AND f.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY f.id DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const records = db.prepare(sql).all(...params);
  const { total } = db.prepare('SELECT COUNT(*) as total FROM frozen_income').get();

  res.json({ items: records, total, page: Number(page), pageSize: Number(pageSize) });
});

module.exports = router;
