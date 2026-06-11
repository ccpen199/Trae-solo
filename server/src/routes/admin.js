const express = require('express');
const db = require('../database/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', auth(['admin', 'manager']), (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE status = 1').get().count;
  const totalMerchants = db.prepare('SELECT COUNT(*) as count FROM merchants WHERE status = 1').get().count;
  const totalServices = db.prepare('SELECT COUNT(*) as count FROM services WHERE status = 1').get().count;
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const totalAmount = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status >= 2').get().total;
  
  const pendingMerchants = db.prepare('SELECT COUNT(*) as count FROM merchants WHERE status = 0').get().count;
  const pendingReviews = db.prepare('SELECT COUNT(*) as count FROM reviews WHERE verified = 0').get().count;
  
  const recentOrders = db.prepare(`
    SELECT o.*, s.name as service_name, m.company_name, u.real_name as user_name
    FROM orders o
    LEFT JOIN services s ON o.service_id = s.id
    LEFT JOIN merchants m ON o.merchant_id = m.id
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.id DESC
    LIMIT 10
  `).all();
  
  const topMerchants = db.prepare(`
    SELECT m.*, COUNT(o.id) as order_count
    FROM merchants m
    LEFT JOIN orders o ON m.id = o.merchant_id AND o.status >= 2
    WHERE m.status = 1
    GROUP BY m.id
    ORDER BY order_count DESC
    LIMIT 5
  `).all();
  
  res.json({
    stats: {
      total_users: totalUsers,
      total_merchants: totalMerchants,
      total_services: totalServices,
      total_orders: totalOrders,
      total_amount: totalAmount,
      pending_merchants: pendingMerchants,
      pending_reviews: pendingReviews
    },
    recent_orders: recentOrders,
    top_merchants: topMerchants
  });
});

router.get('/merchants/pending', auth(['admin', 'manager']), (req, res) => {
  const merchants = db.prepare(`
    SELECT m.*, u.username, u.phone, u.email
    FROM merchants m
    LEFT JOIN users u ON m.user_id = u.id
    WHERE m.status = 0
    ORDER BY m.id DESC
  `).all();
  
  res.json(merchants);
});

router.put('/merchants/:id/approve', auth(['admin', 'manager']), (req, res) => {
  const { deposit_amount } = req.body;
  
  db.prepare(`
    UPDATE merchants 
    SET status = 1, deposit_amount = ?, deposit_status = 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(deposit_amount || 50000, req.params.id);
  
  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.id);
  if (merchant) {
    db.prepare(`
      INSERT INTO deposit_records (merchant_id, amount, type, remark)
      VALUES (?, ?, ?, ?)
    `).run(req.params.id, deposit_amount || 50000, 'deposit', '入驻保证金缴纳');
  }
  
  res.json({ message: '审核通过' });
});

router.put('/merchants/:id/reject', auth(['admin', 'manager']), (req, res) => {
  const { reason } = req.body;
  
  db.prepare(`
    UPDATE merchants SET status = 2, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(req.params.id);
  
  res.json({ message: '已拒绝' });
});

router.get('/knowledge', auth(['admin', 'manager', 'couple', 'merchant']), (req, res) => {
  const { category, parent_id } = req.query;
  
  let where = 'WHERE status = 1';
  const params = [];
  
  if (category) {
    where += ' AND category = ?';
    params.push(category);
  }
  
  if (parent_id !== undefined) {
    where += ' AND parent_id = ?';
    params.push(parseInt(parent_id));
  }
  
  const nodes = db.prepare(`
    SELECT * FROM knowledge_graph
    ${where}
    ORDER BY parent_id ASC, sort_order ASC, id ASC
  `).all(...params);
  
  res.json(nodes);
});

router.post('/knowledge', auth(['admin', 'manager']), (req, res) => {
  const { title, content, category, parent_id, sort_order } = req.body;
  
  const result = db.prepare(`
    INSERT INTO knowledge_graph (title, content, category, parent_id, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `).run(title, content || '', category || 'process', parent_id || 0, sort_order || 0);
  
  res.status(201).json({ id: result.lastInsertRowid, message: '创建成功' });
});

router.put('/knowledge/:id', auth(['admin', 'manager']), (req, res) => {
  const { title, content, category, parent_id, sort_order, status } = req.body;
  
  db.prepare(`
    UPDATE knowledge_graph 
    SET title = ?, content = ?, category = ?, parent_id = ?, sort_order = ?, status = ?
    WHERE id = ?
  `).run(title, content, category, parent_id, sort_order, status ?? 1, req.params.id);
  
  res.json({ message: '更新成功' });
});

router.delete('/knowledge/:id', auth(['admin']), (req, res) => {
  db.prepare('DELETE FROM knowledge_graph WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

router.get('/city-managers', auth(['admin']), (req, res) => {
  const managers = db.prepare(`
    SELECT cm.*, u.username, u.real_name, u.phone, u.email
    FROM city_managers cm
    LEFT JOIN users u ON cm.user_id = u.id
    ORDER BY cm.city ASC
  `).all();
  
  res.json(managers);
});

router.post('/city-managers', auth(['admin']), (req, res) => {
  const { user_id, city, level } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run('manager', user_id);
  
  const result = db.prepare(`
    INSERT INTO city_managers (user_id, city, level)
    VALUES (?, ?, ?)
  `).run(user_id, city, level || 1);
  
  res.status(201).json({ id: result.lastInsertRowid, message: '创建成功' });
});

router.get('/deposits', auth(['admin', 'manager']), (req, res) => {
  const { merchant_id, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = 'WHERE 1=1';
  const params = [];
  
  if (merchant_id) {
    where += ' AND dr.merchant_id = ?';
    params.push(merchant_id);
  }
  
  const records = db.prepare(`
    SELECT dr.*, m.company_name
    FROM deposit_records dr
    LEFT JOIN merchants m ON dr.merchant_id = m.id
    ${where}
    ORDER BY dr.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM deposit_records dr ${where}`).get(...params).count;
  
  const depositSum = db.prepare(`
    SELECT 
      SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) as total_deposit,
      SUM(CASE WHEN type = 'freeze' THEN amount ELSE 0 END) as total_freeze,
      SUM(CASE WHEN type = 'unfreeze' THEN amount ELSE 0 END) as total_unfreeze,
      SUM(CASE WHEN type = 'deduct' THEN amount ELSE 0 END) as total_deduct
    FROM deposit_records
  `).get();
  
  res.json({ 
    data: records, 
    total, 
    page: parseInt(page), 
    pageSize: parseInt(pageSize),
    summary: depositSum
  });
});

router.post('/deposits/:merchant_id/deduct', auth(['admin', 'manager']), (req, res) => {
  const { amount, remark } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: '请输入有效金额' });
  }
  
  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.merchant_id);
  if (!merchant) {
    return res.status(404).json({ error: '商家不存在' });
  }
  
  const availableDeposit = merchant.deposit_amount;
  if (amount > availableDeposit) {
    return res.status(400).json({ error: `保证金不足，可用余额: ${availableDeposit}` });
  }
  
  db.prepare(`
    UPDATE merchants SET deposit_amount = deposit_amount - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(amount, req.params.merchant_id);
  
  db.prepare(`
    INSERT INTO deposit_records (merchant_id, amount, type, remark)
    VALUES (?, ?, ?, ?)
  `).run(req.params.merchant_id, amount, 'deduct', remark || '保证金扣除');
  
  res.json({ message: '扣除成功', remaining: merchant.deposit_amount - amount });
});

router.post('/deposits/:merchant_id/recharge', auth(['admin', 'manager']), (req, res) => {
  const { amount, remark } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: '请输入有效金额' });
  }
  
  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.merchant_id);
  if (!merchant) {
    return res.status(404).json({ error: '商家不存在' });
  }
  
  db.prepare(`
    UPDATE merchants SET deposit_amount = deposit_amount + ?, deposit_status = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(amount, req.params.merchant_id);
  
  db.prepare(`
    INSERT INTO deposit_records (merchant_id, amount, type, remark)
    VALUES (?, ?, ?, ?)
  `).run(req.params.merchant_id, amount, 'deposit', remark || '保证金补缴');
  
  res.json({ message: '补缴成功', new_balance: merchant.deposit_amount + amount });
});

module.exports = router;
