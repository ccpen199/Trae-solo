const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const checkAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '请先登录' });
  }
  next();
};

router.use(authenticateToken, checkAdmin);

router.get('/dashboard', (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const listingCount = db.prepare('SELECT COUNT(*) as count FROM listings WHERE status = 1').get().count;
  const transactionCount = db.prepare('SELECT COUNT(*) as count FROM transactions').get().count;
  const reportCount = db.prepare('SELECT COUNT(*) as count FROM reports WHERE status = 0').get().count;

  res.json({
    userCount,
    listingCount,
    transactionCount,
    reportCount
  });
});

router.get('/listings', (req, res) => {
  const { status, page = 1, pageSize = 20 } = req.query;
  
  let sql = `
    SELECT l.*, c.name as category_name, u.nickname as author_name
    FROM listings l
    LEFT JOIN categories c ON l.category_id = c.id
    LEFT JOIN users u ON l.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status !== undefined) {
    sql += ' AND l.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const listings = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM listings').get().count;

  res.json({ listings, total });
});

router.post('/listings/:id/verify', (req, res) => {
  db.prepare('UPDATE listings SET is_verified = 1 WHERE id = ?').run(req.params.id);
  
  db.prepare('INSERT INTO operation_logs (operator_id, action, target_type, target_id) VALUES (?, ?, ?, ?)').run(
    req.user.id, 'verify_listing', 'listing', req.params.id
  );

  res.json({ message: '审核通过' });
});

router.post('/listings/:id/offline', (req, res) => {
  const { reason } = req.body;
  db.prepare('UPDATE listings SET status = 2 WHERE id = ?').run(req.params.id);
  
  db.prepare('INSERT INTO operation_logs (operator_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)').run(
    req.user.id, 'offline_listing', 'listing', req.params.id, JSON.stringify({ reason })
  );

  res.json({ message: '已下线' });
});

router.get('/reports', (req, res) => {
  const { status, page = 1, pageSize = 20 } = req.query;
  
  let sql = `
    SELECT r.*, l.title as listing_title, u.nickname as reporter_name
    FROM reports r
    LEFT JOIN listings l ON r.listing_id = l.id
    LEFT JOIN users u ON r.reporter_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status !== undefined) {
    sql += ' AND r.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const reports = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM reports').get().count;

  res.json({ reports, total });
});

router.post('/reports/:id/handle', (req, res) => {
  const { action } = req.body;
  
  db.prepare('UPDATE reports SET status = 1, handled_at = CURRENT_TIMESTAMP, handler_id = ? WHERE id = ?').run(
    req.user.id, req.params.id
  );

  if (action === 'offline') {
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
    if (report && report.listing_id) {
      db.prepare('UPDATE listings SET status = 2 WHERE id = ?').run(report.listing_id);
    }
  }

  db.prepare('INSERT INTO operation_logs (operator_id, action, target_type, target_id) VALUES (?, ?, ?, ?)').run(
    req.user.id, 'handle_report', 'report', req.params.id
  );

  res.json({ message: '处理完成' });
});

router.get('/whitelist', (req, res) => {
  const whitelist = db.prepare(`
    SELECT w.*, u.nickname as user_name, c.name as category_name
    FROM whitelist w
    LEFT JOIN users u ON w.user_id = u.id
    LEFT JOIN categories c ON w.category_id = c.id
    ORDER BY w.created_at DESC
  `).all();

  res.json(whitelist);
});

router.post('/whitelist', (req, res) => {
  const { user_id, category_id, reason, phone } = req.body;
  
  db.prepare('INSERT INTO whitelist (user_id, category_id, reason, phone) VALUES (?, ?, ?, ?)').run(
    user_id || 0, category_id || 0, reason || '', phone || ''
  );

  db.prepare('INSERT INTO operation_logs (operator_id, action, target_type, target_id) VALUES (?, ?, ?, ?)').run(
    req.user.id, 'add_whitelist', 'whitelist', user_id || 0
  );

  res.json({ message: '添加成功' });
});

router.get('/logs', (req, res) => {
  const { page = 1, pageSize = 50 } = req.query;
  
  const logs = db.prepare(`
    SELECT ol.*, u.nickname as operator_name
    FROM operation_logs ol
    LEFT JOIN users u ON ol.operator_id = u.id
    ORDER BY ol.created_at DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const total = db.prepare('SELECT COUNT(*) as count FROM operation_logs').get().count;

  res.json({ logs, total });
});

module.exports = router;
