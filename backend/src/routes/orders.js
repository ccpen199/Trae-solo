const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function generateOrderNo() {
  const date = new Date();
  const prefix = 'GIFT' + date.getFullYear() + 
    String(date.getMonth() + 1).padStart(2, '0') + 
    String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return prefix + random;
}

router.get('/', authMiddleware(), (req, res) => {
  const db = req.app.get('db');
  const { status, userId, receiverId, giftId, startTime, endTime, page = 1, pageSize = 20 } = req.query;

  let sql = `
    SELECT o.*, u.username as user_name, u.nickname as user_nickname,
           r.username as receiver_name, r.nickname as receiver_nickname,
           g.name as gift_name, g.icon as gift_icon
    FROM gift_orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN users r ON o.receiver_id = r.id
    LEFT JOIN gifts g ON o.gift_id = g.id
    WHERE 1=1
  `;
  let countSql = 'SELECT COUNT(*) as total FROM gift_orders o WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND o.status = ?';
    countSql += ' AND o.status = ?';
    params.push(status);
  }
  if (userId) {
    sql += ' AND o.user_id = ?';
    countSql += ' AND o.user_id = ?';
    params.push(userId);
  }
  if (receiverId) {
    sql += ' AND o.receiver_id = ?';
    countSql += ' AND o.receiver_id = ?';
    params.push(receiverId);
  }
  if (giftId) {
    sql += ' AND o.gift_id = ?';
    countSql += ' AND o.gift_id = ?';
    params.push(giftId);
  }
  if (startTime) {
    sql += ' AND o.created_at >= ?';
    countSql += ' AND o.created_at >= ?';
    params.push(startTime);
  }
  if (endTime) {
    sql += ' AND o.created_at <= ?';
    countSql += ' AND o.created_at <= ?';
    params.push(endTime);
  }

  sql += ' ORDER BY o.id DESC LIMIT ? OFFSET ?';
  const queryParams = [...params, Number(pageSize), (Number(page) - 1) * Number(pageSize)];

  const orders = db.prepare(sql).all(...queryParams);
  const { total } = db.prepare(countSql).get(...params);

  res.json({ items: orders, total, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/send', authMiddleware(), (req, res) => {
  const db = req.app.get('db');
  const { giftId, receiverId, quantity = 1, scene, message } = req.body;
  const userId = req.user.id;

  const gift = db.prepare('SELECT * FROM gifts WHERE id = ? AND status = ?').get(giftId, 'online');
  if (!gift) {
    return res.status(400).json({ error: '礼物不存在或已下架' });
  }

  if (gift.stock < quantity) {
    return res.status(400).json({ error: '礼物库存不足' });
  }

  const totalAmount = gift.price * quantity;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (user.balance < totalAmount) {
    const failOrderNo = generateOrderNo();
    db.prepare(`
      INSERT INTO gift_orders (order_no, user_id, gift_id, quantity, unit_price, total_amount, receiver_id, scene, message, status, fail_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(failOrderNo, userId, giftId, quantity, gift.price, totalAmount, receiverId, scene, message, 'failed', '余额不足');
    
    if (totalAmount >= 1000) {
      db.prepare(`
        INSERT INTO risk_records (type, user_id, order_id, amount, reason)
        VALUES (?, ?, (SELECT id FROM gift_orders WHERE order_no = ?), ?, ?)
      `).run('abnormal_recharge', userId, failOrderNo, totalAmount, '用户尝试大额赠送但余额不足，可能存在异常');
    }
    
    return res.status(400).json({ error: '余额不足，请先充值' });
  }

  const receiver = db.prepare('SELECT * FROM users WHERE id = ?').get(receiverId);
  if (!receiver) {
    return res.status(400).json({ error: '接收方不存在' });
  }

  const orderNo = generateOrderNo();

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO gift_orders (order_no, user_id, gift_id, quantity, unit_price, total_amount, receiver_id, scene, message, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(orderNo, userId, giftId, quantity, gift.price, totalAmount, receiverId, scene, message, 'success');

    db.prepare('UPDATE users SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(totalAmount, userId);
    db.prepare('UPDATE users SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(totalAmount * 0.5, receiverId);

    db.prepare(`
      INSERT INTO balance_records (user_id, amount, type, order_id, remark, balance_after)
      VALUES (?, ?, ?, ?, ?, (SELECT balance FROM users WHERE id = ?))
    `).run(userId, -totalAmount, 'send_gift', db.lastInsertRowid, `赠送礼物: ${gift.name} x ${quantity}`, userId);

    db.prepare(`
      INSERT INTO balance_records (user_id, amount, type, order_id, remark, balance_after)
      VALUES (?, ?, ?, ?, ?, (SELECT balance FROM users WHERE id = ?))
    `).run(receiverId, totalAmount * 0.5, 'receive_gift', db.lastInsertRowid, `收到礼物: ${gift.name} x ${quantity}`, receiverId);

    db.prepare('UPDATE gifts SET stock = stock - ? WHERE id = ?').run(quantity, giftId);
  });

  try {
    tx();
    
    const recentCount = db.prepare(`
      SELECT COUNT(*) as count FROM gift_orders 
      WHERE user_id = ? AND receiver_id = ? AND status = 'success' 
      AND created_at >= datetime('now', '-5 minutes')
    `).get(userId, receiverId);
    
    if (recentCount.count >= 10) {
      db.prepare(`
        INSERT INTO risk_records (type, user_id, order_id, amount, reason)
        VALUES (?, ?, (SELECT id FROM gift_orders WHERE order_no = ?), ?, ?)
      `).run('malicious_ranking', userId, orderNo, totalAmount, '5分钟内给同一主播送礼超过10次，疑似恶意刷榜');
    }
    
    res.json({ success: true, orderNo });
  } catch (err) {
    db.prepare(`
      INSERT INTO gift_orders (order_no, user_id, gift_id, quantity, unit_price, total_amount, receiver_id, scene, message, status, fail_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(generateOrderNo(), userId, giftId, quantity, gift.price, totalAmount, receiverId, scene, message, 'failed', err.message);
    res.status(500).json({ error: '赠送失败' });
  }
});

router.post('/recharge', authMiddleware(), (req, res) => {
  const db = req.app.get('db');
  const { amount } = req.body;
  const userId = req.user.id;

  if (amount <= 0) {
    return res.status(400).json({ error: '充值金额必须大于0' });
  }

  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(amount, userId);
    db.prepare(`
      INSERT INTO balance_records (user_id, amount, type, remark, balance_after)
      VALUES (?, ?, ?, ?, (SELECT balance FROM users WHERE id = ?))
    `).run(userId, amount, 'recharge', `充值${amount}元`, userId);
  });

  tx();
  
  if (amount >= 10000) {
    const dayTotal = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM balance_records 
      WHERE user_id = ? AND type = 'recharge' AND created_at >= datetime('now', '-1 day')
    `).get(userId);
    
    if (dayTotal.total >= 50000) {
      db.prepare(`
        INSERT INTO risk_records (type, user_id, amount, reason)
        VALUES (?, ?, ?, ?)
      `).run('abnormal_recharge', userId, amount, '单日累计充值超过5万元，疑似异常充值');
    }
  }
  
  res.json({ success: true });
});

router.get('/balance-records', authMiddleware(), (req, res) => {
  const db = req.app.get('db');
  const { userId, type, page = 1, pageSize = 20 } = req.query;

  let sql = 'SELECT br.*, u.username, u.nickname FROM balance_records br LEFT JOIN users u ON br.user_id = u.id WHERE 1=1';
  const params = [];

  if (userId) {
    sql += ' AND br.user_id = ?';
    params.push(userId);
  }
  if (type) {
    sql += ' AND br.type = ?';
    params.push(type);
  }

  sql += ' ORDER BY br.id DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const records = db.prepare(sql).all(...params);
  const { total } = db.prepare('SELECT COUNT(*) as total FROM balance_records').get();

  res.json({ items: records, total, page: Number(page), pageSize: Number(pageSize) });
});

module.exports = router;
