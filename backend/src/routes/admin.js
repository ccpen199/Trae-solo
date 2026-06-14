const express = require('express');
const db = require('../db');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

function logOperation(adminId, action, targetType, targetId, ip) {
  db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, ip_address) VALUES (?, ?, ?, ?, ?)')
    .run(adminId, action, targetType, targetId, ip);
}

router.get('/dashboard', authenticateAdmin, (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const cardCount = db.prepare('SELECT COUNT(*) as count FROM tianfutong_cards').get().count;
  const transactionCount = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE created_at >= datetime("now", "-30 days")').get().count;
  const totalAmount = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE transaction_type = "ride_complete" AND created_at >= datetime("now", "-30 days")').get().total;
  
  const regionStats = db.prepare(`
    SELECT r.region_name, COUNT(c.id) as card_count
    FROM regions r
    LEFT JOIN tianfutong_cards c ON c.region = r.region_name
    WHERE r.level = 2
    GROUP BY r.id
    ORDER BY card_count DESC
  `).all();
  
  const dailyTransactions = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count, COALESCE(SUM(amount), 0) as amount
    FROM transactions
    WHERE created_at >= datetime("now", "-7 days")
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all();
  
  const transportStats = db.prepare(`
    SELECT transport_type, COUNT(*) as count, COALESCE(SUM(amount), 0) as amount
    FROM transactions
    WHERE transaction_type = "ride_complete" AND created_at >= datetime("now", "-30 days")
    GROUP BY transport_type
  `).all();
  
  const flaggedTx = db.prepare('SELECT COUNT(*) as count FROM blocked_transactions WHERE resolved = 0').get().count;
  const pendingRenewals = db.prepare('SELECT COUNT(*) as count FROM card_renewals WHERE review_status = "pending"').get().count;
  
  res.success({
    user_count: userCount,
    card_count: cardCount,
    transaction_count_30d: transactionCount,
    total_amount_30d: totalAmount,
    region_stats: regionStats,
    daily_transactions: dailyTransactions,
    transport_stats: transportStats,
    flagged_transactions: flaggedTx,
    pending_renewals: pendingRenewals
  }, '获取成功');
});

router.get('/users', authenticateAdmin, (req, res) => {
  const { page = 1, page_size = 20, keyword, status } = req.query;
  const offset = (page - 1) * page_size;
  
  let sql = 'SELECT id, phone, real_name, user_type, status, created_at FROM users WHERE 1=1';
  const params = [];
  
  if (keyword) {
    sql += ' AND (phone LIKE ? OR real_name LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw);
  }

  if (status !== undefined && status !== '') {
    const normalizedStatus = status === 'active' ? 1 : status === 'inactive' ? 0 : Number(status);
    sql += ' AND status = ?';
    params.push(normalizedStatus);
  }
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), offset);
  
  const users = db.prepare(sql).all(...params);
  
  let countSql = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
  if (keyword) {
    countSql += ' AND (phone LIKE ? OR real_name LIKE ?)';
  }
  if (status !== undefined && status !== '') {
    countSql += ' AND status = ?';
  }
  const countParams = params.slice(0, -2);
  const total = db.prepare(countSql).get(...countParams).count;
  
  res.success({
    list: users,
    total,
    page: parseInt(page),
    page_size: parseInt(page_size)
  }, '获取成功');
});

router.get('/users/:id', authenticateAdmin, (req, res) => {
  const user = db.prepare('SELECT id, phone, real_name, id_card, user_type, avatar, address, status, created_at FROM users WHERE id = ?').get(req.params.id);
  
  if (!user) {
    return res.error('用户不存在', 404);
  }
  
  const cards = db.prepare('SELECT * FROM tianfutong_cards WHERE user_id = ?').all(req.params.id);
  const points = db.prepare('SELECT * FROM user_points WHERE user_id = ?').get(req.params.id);
  
  res.success({ user, cards, points }, '获取成功');
});

router.put('/users/:id/status', authenticateAdmin, (req, res) => {
  const { status } = req.body;
  const normalizedStatus = status === 'active' ? 1 : status === 'inactive' ? 0 : Number(status);
  
  db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(normalizedStatus, req.params.id);
  
  logOperation(req.admin.id, 'update_user_status', 'user', req.params.id, req.ip);
  
  res.success(null, '更新成功');
});

router.get('/cards', authenticateAdmin, (req, res) => {
  const { page = 1, page_size = 20, keyword, card_type, status, region } = req.query;
  const offset = (page - 1) * page_size;
  
  let sql = `
    SELECT tc.*, u.phone, u.real_name
    FROM tianfutong_cards tc
    LEFT JOIN users u ON tc.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (keyword) {
    sql += ' AND (tc.card_no LIKE ? OR u.phone LIKE ? OR u.real_name LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }
  
  if (card_type) {
    sql += ' AND tc.card_type = ?';
    params.push(card_type);
  }
  
  if (status) {
    sql += ' AND tc.card_status = ?';
    params.push(status);
  }
  
  if (region) {
    sql += ' AND tc.region = ?';
    params.push(region);
  }
  
  sql += ' ORDER BY tc.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), offset);
  
  const cards = db.prepare(sql).all(...params);
  
  let countSql = `
    SELECT COUNT(*) as count
    FROM tianfutong_cards tc
    LEFT JOIN users u ON tc.user_id = u.id
    WHERE 1=1
  `;
  const countParams = params.slice(0, -2);
  const total = db.prepare(countSql).get(...countParams).count;
  
  res.success({
    list: cards,
    total,
    page: parseInt(page),
    page_size: parseInt(page_size)
  }, '获取成功');
});

router.put('/cards/:id/status', authenticateAdmin, (req, res) => {
  const { card_status, status } = req.body;
  const nextStatus = card_status || status;
  
  db.prepare('UPDATE tianfutong_cards SET card_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(nextStatus, req.params.id);
  
  logOperation(req.admin.id, 'update_card_status', 'card', req.params.id, req.ip);
  
  res.success(null, '更新成功');
});

router.get('/transactions', authenticateAdmin, (req, res) => {
  const { page = 1, page_size = 20, keyword, start_date, end_date, transport_type, status } = req.query;
  const offset = (page - 1) * page_size;
  
  let sql = `
    SELECT t.*, u.phone, u.real_name
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (keyword) {
    sql += ' AND (t.transaction_no LIKE ? OR t.card_no LIKE ? OR u.phone LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }
  
  if (start_date) {
    sql += ' AND t.created_at >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    sql += ' AND t.created_at <= ?';
    params.push(end_date + ' 23:59:59');
  }
  
  if (transport_type) {
    sql += ' AND t.transport_type = ?';
    params.push(transport_type);
  }
  
  if (status) {
    sql += ' AND t.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), offset);
  
  const transactions = db.prepare(sql).all(...params);
  
  let countSql = `
    SELECT COUNT(*) as count
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    WHERE 1=1
  `;
  const countParams = params.slice(0, -2);
  const total = db.prepare(countSql).get(...countParams).count;
  
  res.success({
    list: transactions,
    total,
    page: parseInt(page),
    page_size: parseInt(page_size)
  }, '获取成功');
});

router.get('/transactions/:id', authenticateAdmin, (req, res) => {
  const transaction = db.prepare(`
    SELECT t.*, u.phone, u.real_name
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    WHERE t.id = ?
  `).get(req.params.id);
  
  if (!transaction) {
    return res.error('交易不存在', 404);
  }
  
  res.success(transaction, '获取成功');
});

router.get('/risk/blocked', authenticateAdmin, (req, res) => {
  const { page = 1, page_size = 20, resolved } = req.query;
  const offset = (page - 1) * page_size;
  
  let sql = `
    SELECT bt.*, t.transaction_no, t.amount, t.user_id, t.card_no, u.phone, u.real_name
    FROM blocked_transactions bt
    LEFT JOIN transactions t ON bt.transaction_id = t.id
    LEFT JOIN users u ON t.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (resolved !== undefined) {
    sql += ' AND bt.resolved = ?';
    params.push(resolved ? 1 : 0);
  }
  
  sql += ' ORDER BY bt.blocked_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), offset);
  
  const blocked = db.prepare(sql).all(...params);
  
  const total = db.prepare('SELECT COUNT(*) as count FROM blocked_transactions WHERE resolved = 0').get().count;
  
  res.success({
    list: blocked,
    total,
    page: parseInt(page),
    page_size: parseInt(page_size)
  }, '获取成功');
});

router.post('/risk/blocked/:id/resolve', authenticateAdmin, (req, res) => {
  const { action, comment } = req.body;
  
  const blocked = db.prepare('SELECT * FROM blocked_transactions WHERE id = ?').get(req.params.id);
  
  if (!blocked) {
    return res.error('记录不存在', 404);
  }
  
  if (action === 'release') {
    db.prepare('UPDATE transactions SET status = "success", is_flagged = 1 WHERE id = ?').run(blocked.transaction_id);
  } else if (action === 'reject') {
    db.prepare('UPDATE transactions SET status = "rejected", is_flagged = 1 WHERE id = ?').run(blocked.transaction_id);
  }
  
  db.prepare(`
    UPDATE blocked_transactions 
    SET resolved = 1, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP, reason = ?
    WHERE id = ?
  `).run(req.admin.id, comment || '', req.params.id);
  
  logOperation(req.admin.id, `resolve_risk_${action}`, 'blocked_transaction', req.params.id, req.ip);
  
  res.success(null, '处理成功');
});

router.get('/renewals', authenticateAdmin, (req, res) => {
  const { page = 1, page_size = 20, status } = req.query;
  const offset = (page - 1) * page_size;
  
  let sql = `
    SELECT cr.*, tc.card_no, tc.card_type, u.phone, u.real_name
    FROM card_renewals cr
    LEFT JOIN tianfutong_cards tc ON cr.card_id = tc.id
    LEFT JOIN users u ON cr.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND cr.review_status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY cr.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), offset);
  
  const renewals = db.prepare(sql).all(...params);
  
  const total = db.prepare('SELECT COUNT(*) as count FROM card_renewals WHERE review_status = "pending"').get().count;
  
  res.success({
    list: renewals,
    total,
    page: parseInt(page),
    page_size: parseInt(page_size)
  }, '获取成功');
});

router.post('/renewals/:id/review', authenticateAdmin, (req, res) => {
  const { review_status, review_comment } = req.body;
  
  const renewal = db.prepare('SELECT * FROM card_renewals WHERE id = ?').get(req.params.id);
  
  if (!renewal) {
    return res.error('记录不存在', 404);
  }
  
  db.prepare(`
    UPDATE card_renewals 
    SET review_status = ?, review_comment = ?, reviewer_id = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(review_status, review_comment || '', req.admin.id, req.params.id);
  
  if (review_status === 'approved') {
    const newExpiry = new Date();
    newExpiry.setFullYear(newExpiry.getFullYear() + 1);
    db.prepare('UPDATE tianfutong_cards SET expiry_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newExpiry.toISOString().split('T')[0], renewal.card_id);
  }
  
  logOperation(req.admin.id, `review_renewal_${review_status}`, 'card_renewal', req.params.id, req.ip);
  
  res.success(null, '审核完成');
});

router.get('/regions', authenticateAdmin, (req, res) => {
  const regions = db.prepare('SELECT * FROM regions ORDER BY level, region_code').all();
  
  const tree = [];
  const map = {};
  
  regions.forEach(r => {
    map[r.region_code] = { ...r, children: [] };
  });
  
  regions.forEach(r => {
    if (r.parent_code && map[r.parent_code]) {
      map[r.parent_code].children.push(map[r.region_code]);
    } else if (!r.parent_code) {
      tree.push(map[r.region_code]);
    }
  });
  
  res.success({ list: regions, tree }, '获取成功');
});

router.get('/routes', authenticateAdmin, (req, res) => {
  const routes = db.prepare('SELECT * FROM routes ORDER BY transport_type, route_no').all();
  
  routes.forEach(r => {
    r.stations = JSON.parse(r.stations || '[]');
    r.crowding_data = JSON.parse(r.crowding_data || '{}');
  });
  
  res.success(routes, '获取成功');
});

router.post('/routes', authenticateAdmin, (req, res) => {
  const { route_no, route_name, transport_type, start_station, end_station, first_departure, last_departure, fare, stations } = req.body;
  
  const result = db.prepare(`
    INSERT INTO routes (route_no, route_name, transport_type, start_station, end_station, first_departure, last_departure, fare, stations, crowding_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(route_no, route_name, transport_type, start_station, end_station, first_departure, last_departure, fare, JSON.stringify(stations || []), JSON.stringify({}));
  
  logOperation(req.admin.id, 'create_route', 'route', result.lastInsertRowid, req.ip);
  
  res.success({ id: result.lastInsertRowid }, '创建成功');
});

router.put('/routes/:id', authenticateAdmin, (req, res) => {
  const { route_no, route_name, transport_type, start_station, end_station, first_departure, last_departure, fare, stations, status } = req.body;
  
  const current = db.prepare('SELECT * FROM routes WHERE id = ?').get(req.params.id);
  const currentStations = JSON.parse(current.stations || '[]');
  const currentCrowding = JSON.parse(current.crowding_data || '{}');
  
  db.prepare(`
    UPDATE routes 
    SET route_no = ?, route_name = ?, transport_type = ?, start_station = ?, end_station = ?, 
        first_departure = ?, last_departure = ?, fare = ?, stations = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(route_no || current.route_no, route_name || current.route_name, transport_type || current.transport_type,
         start_station || current.start_station, end_station || current.end_station,
         first_departure || current.first_departure, last_departure || current.last_departure,
         fare || current.fare, JSON.stringify(stations || currentStations),
         status !== undefined ? status : current.status, req.params.id);
  
  logOperation(req.admin.id, 'update_route', 'route', req.params.id, req.ip);
  
  res.success(null, '更新成功');
});

router.get('/products', authenticateAdmin, (req, res) => {
  const products = db.prepare('SELECT * FROM point_products ORDER BY points_cost').all();
  res.success(products, '获取成功');
});

router.post('/products', authenticateAdmin, (req, res) => {
  const { product_code, product_name, description, points_cost, stock, category } = req.body;
  
  const result = db.prepare(`
    INSERT INTO point_products (product_code, product_name, description, points_cost, stock, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(product_code, product_name, description || '', points_cost, stock || 0, category || '');
  
  logOperation(req.admin.id, 'create_product', 'point_product', result.lastInsertRowid, req.ip);
  
  res.success({ id: result.lastInsertRowid }, '创建成功');
});

router.put('/products/:id', authenticateAdmin, (req, res) => {
  const { product_name, description, points_cost, stock, category, status } = req.body;
  
  db.prepare(`
    UPDATE point_products 
    SET product_name = ?, description = ?, points_cost = ?, stock = ?, category = ?, status = ?
    WHERE id = ?
  `).run(product_name, description, points_cost, stock, category, status, req.params.id);
  
  logOperation(req.admin.id, 'update_product', 'point_product', req.params.id, req.ip);
  
  res.success(null, '更新成功');
});

router.get('/operation-logs', authenticateAdmin, (req, res) => {
  const { page = 1, page_size = 20 } = req.query;
  const offset = (page - 1) * page_size;
  
  const logs = db.prepare(`
    SELECT ol.*, a.username, a.real_name
    FROM operation_logs ol
    LEFT JOIN admins a ON ol.admin_id = a.id
    ORDER BY ol.created_at DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(page_size), offset);
  
  const total = db.prepare('SELECT COUNT(*) as count FROM operation_logs').get().count;
  
  res.success({
    list: logs,
    total,
    page: parseInt(page),
    page_size: parseInt(page_size)
  }, '获取成功');
});

router.get('/admins', authenticateAdmin, (req, res) => {
  if (req.admin.role !== 'super_admin') {
    return res.error('无权限访问', 403);
  }
  
  const admins = db.prepare('SELECT id, username, real_name, role, region, status, created_at FROM admins ORDER BY created_at').all();
  res.success(admins, '获取成功');
});

router.post('/admins', authenticateAdmin, (req, res) => {
  if (req.admin.role !== 'super_admin') {
    return res.error('无权限访问', 403);
  }
  
  const bcrypt = require('bcryptjs');
  const { username, password, real_name, role, region } = req.body;
  
  const hash = bcrypt.hashSync(password, 10);
  
  const result = db.prepare(`
    INSERT INTO admins (username, password, real_name, role, region)
    VALUES (?, ?, ?, ?, ?)
  `).run(username, hash, real_name, role || 'operator', region || '');
  
  logOperation(req.admin.id, 'create_admin', 'admin', result.lastInsertRowid, req.ip);
  
  res.success({ id: result.lastInsertRowid }, '创建成功');
});

module.exports = router;
