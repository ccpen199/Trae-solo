require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 58851;
const JWT_SECRET = 'property-sales-secret-key-2024';

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48851}`,
  credentials: true
}));
app.use(express.json());

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '未授权访问' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token无效' });
    }
    req.user = user;
    next();
  });
}

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/buildings', authenticateToken, (req, res) => {
  const buildings = db.prepare('SELECT * FROM buildings ORDER BY id').all();
  res.json(buildings);
});

app.get('/api/properties', authenticateToken, (req, res) => {
  const { building_id, status, floor } = req.query;
  
  let sql = `
    SELECT p.*, b.name as building_name,
           l.customer_name as lock_customer, l.expire_at as lock_expire,
           u.name as consultant_name
    FROM properties p
    LEFT JOIN buildings b ON p.building_id = b.id
    LEFT JOIN locks l ON p.id = l.property_id AND l.status = 'active'
    LEFT JOIN users u ON l.consultant_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (building_id) {
    sql += ' AND p.building_id = ?';
    params.push(building_id);
  }
  if (status) {
    sql += ' AND p.status = ?';
    params.push(status);
  }
  if (floor) {
    sql += ' AND p.floor = ?';
    params.push(floor);
  }

  sql += ' ORDER BY p.building_id, p.floor, p.unit_number';
  
  const properties = db.prepare(sql).all(...params);
  res.json(properties);
});

app.get('/api/properties/:id', authenticateToken, (req, res) => {
  const property = db.prepare(`
    SELECT p.*, b.name as building_name
    FROM properties p
    LEFT JOIN buildings b ON p.building_id = b.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!property) {
    return res.status(404).json({ error: '房源不存在' });
  }

  const history = db.prepare(`
    SELECT sh.*, u.name as operator_name
    FROM status_history sh
    LEFT JOIN users u ON sh.operator_id = u.id
    WHERE sh.property_id = ?
    ORDER BY sh.created_at DESC
  `).all(req.params.id);

  res.json({ ...property, history });
});

function updatePropertyStatus(propertyId, newStatus, source, operatorId) {
  const property = db.prepare('SELECT status FROM properties WHERE id = ?').get(propertyId);
  if (!property) return;

  const oldStatus = property.status;
  
  db.prepare('UPDATE properties SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newStatus, propertyId);

  db.prepare(`
    INSERT INTO status_history (property_id, old_status, new_status, source, operator_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(propertyId, oldStatus, newStatus, source, operatorId);
}

app.post('/api/properties/:id/lock', authenticateToken, (req, res) => {
  const { customer_name, customer_phone, lock_hours = 24 } = req.body;
  const propertyId = req.params.id;
  const consultantId = req.user.id;

  const property = db.prepare('SELECT status FROM properties WHERE id = ?').get(propertyId);
  if (!property) {
    return res.status(404).json({ error: '房源不存在' });
  }

  const activeLock = db.prepare(`
    SELECT * FROM locks 
    WHERE property_id = ? AND status = 'active' AND expire_at > CURRENT_TIMESTAMP
  `).get(propertyId);

  if (activeLock) {
    return res.status(400).json({ error: '该房源已被锁定' });
  }

  if (property.status !== 'available') {
    return res.status(400).json({ error: '该房源不可锁定' });
  }

  const expireAt = new Date(Date.now() + lock_hours * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO locks (property_id, consultant_id, customer_name, customer_phone, expire_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(propertyId, consultantId, customer_name, customer_phone, expireAt);

  updatePropertyStatus(propertyId, 'locked', '锁房', consultantId);

  res.json({ success: true, message: '锁房成功' });
});

app.post('/api/properties/:id/unlock', authenticateToken, (req, res) => {
  const propertyId = req.params.id;

  const lock = db.prepare(`
    SELECT * FROM locks 
    WHERE property_id = ? AND status = 'active'
  `).get(propertyId);

  if (!lock) {
    return res.status(400).json({ error: '该房源未被锁定' });
  }

  db.prepare("UPDATE locks SET status = 'cancelled' WHERE id = ?").run(lock.id);
  updatePropertyStatus(propertyId, 'available', '解锁', req.user.id);

  res.json({ success: true, message: '解锁成功' });
});

app.post('/api/subscriptions', authenticateToken, (req, res) => {
  const { property_id, customer_name, customer_phone, id_card, agreed_price, discount_amount, discount_reason } = req.body;
  const consultantId = req.user.id;

  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(property_id);
  if (!property) {
    return res.status(404).json({ error: '房源不存在' });
  }

  if (property.status !== 'locked' && property.status !== 'available') {
    return res.status(400).json({ error: '该房源不可认购' });
  }

  const needsApproval = agreed_price < property.base_price || discount_amount > 50000;

  const result = db.prepare(`
    INSERT INTO subscriptions (property_id, consultant_id, customer_name, customer_phone, id_card, agreed_price, discount_amount, discount_reason, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    property_id, consultantId, customer_name, customer_phone, id_card,
    agreed_price, discount_amount, discount_reason,
    needsApproval ? 'pending_approval' : 'approved'
  );

  const subscriptionId = result.lastInsertRowid;

  if (needsApproval) {
    const approvalLevel = agreed_price < property.base_price * 0.95 ? 2 : 1;
    db.prepare(`
      INSERT INTO approvals (subscription_id, approval_level, status)
      VALUES (?, ?, 'pending')
    `).run(subscriptionId, approvalLevel);
  }

  if (!needsApproval) {
    updatePropertyStatus(property_id, 'subscribed', '认购', consultantId);
  } else {
    updatePropertyStatus(property_id, 'locked', '认购审批中', consultantId);
  }

  res.json({ success: true, subscription_id: subscriptionId, needs_approval: needsApproval });
});

app.get('/api/subscriptions', authenticateToken, (req, res) => {
  const { status } = req.query;
  
  let sql = `
    SELECT s.*, p.unit_number, p.area, b.name as building_name,
           u.name as consultant_name
    FROM subscriptions s
    LEFT JOIN properties p ON s.property_id = p.id
    LEFT JOIN buildings b ON p.building_id = b.id
    LEFT JOIN users u ON s.consultant_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND s.status = ?';
    params.push(status);
  }

  if (req.user.role === 'consultant') {
    sql += ' AND s.consultant_id = ?';
    params.push(req.user.id);
  }

  sql += ' ORDER BY s.created_at DESC';

  const subscriptions = db.prepare(sql).all(...params);
  res.json(subscriptions);
});

app.get('/api/approvals', authenticateToken, (req, res) => {
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限查看' });
  }

  const approvals = db.prepare(`
    SELECT a.*, s.customer_name, s.agreed_price, s.discount_amount,
           p.unit_number, b.name as building_name,
           u.name as consultant_name
    FROM approvals a
    LEFT JOIN subscriptions s ON a.subscription_id = s.id
    LEFT JOIN properties p ON s.property_id = p.id
    LEFT JOIN buildings b ON p.building_id = b.id
    LEFT JOIN users u ON s.consultant_id = u.id
    WHERE a.status = 'pending'
    ORDER BY a.created_at DESC
  `).all();

  res.json(approvals);
});

app.post('/api/approvals/:id/approve', authenticateToken, (req, res) => {
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限审批' });
  }

  const approval = db.prepare('SELECT * FROM approvals WHERE id = ?').get(req.params.id);
  if (!approval || approval.status !== 'pending') {
    return res.status(400).json({ error: '审批不存在或已处理' });
  }

  db.prepare(`
    UPDATE approvals 
    SET status = 'approved', approver_id = ?, approved_at = CURRENT_TIMESTAMP, comment = ?
    WHERE id = ?
  `).run(req.user.id, req.body.comment || '', req.params.id);

  db.prepare("UPDATE subscriptions SET status = 'approved' WHERE id = ?").run(approval.subscription_id);

  const subscription = db.prepare('SELECT property_id FROM subscriptions WHERE id = ?').get(approval.subscription_id);
  updatePropertyStatus(subscription.property_id, 'subscribed', '审批通过', req.user.id);

  res.json({ success: true, message: '审批通过' });
});

app.post('/api/approvals/:id/reject', authenticateToken, (req, res) => {
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限审批' });
  }

  const approval = db.prepare('SELECT * FROM approvals WHERE id = ?').get(req.params.id);
  if (!approval || approval.status !== 'pending') {
    return res.status(400).json({ error: '审批不存在或已处理' });
  }

  db.prepare(`
    UPDATE approvals 
    SET status = 'rejected', approver_id = ?, approved_at = CURRENT_TIMESTAMP, comment = ?
    WHERE id = ?
  `).run(req.user.id, req.body.comment || '', req.params.id);

  db.prepare("UPDATE subscriptions SET status = 'rejected' WHERE id = ?").run(approval.subscription_id);

  const subscription = db.prepare('SELECT property_id FROM subscriptions WHERE id = ?').get(approval.subscription_id);
  updatePropertyStatus(subscription.property_id, 'available', '审批拒绝', req.user.id);

  res.json({ success: true, message: '已拒绝' });
});

app.post('/api/payments', authenticateToken, (req, res) => {
  if (req.user.role !== 'finance' && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限收款' });
  }

  const { subscription_id, payment_type, amount, payment_method, transaction_no } = req.body;

  const subscription = db.prepare('SELECT s.*, p.area FROM subscriptions s LEFT JOIN properties p ON s.property_id = p.id WHERE s.id = ?').get(subscription_id);
  if (!subscription || subscription.status !== 'approved') {
    return res.status(400).json({ error: '认购单不存在或未审批' });
  }

  const totalPrice = subscription.agreed_price * subscription.area;

  db.prepare(`
    INSERT INTO payments (subscription_id, payment_type, amount, payment_method, transaction_no, status, operator_id, paid_at)
    VALUES (?, ?, ?, ?, ?, 'paid', ?, CURRENT_TIMESTAMP)
  `).run(subscription_id, payment_type, amount, payment_method, transaction_no, req.user.id);

  const depositPaid = db.prepare(`
    SELECT COUNT(*) as count FROM payments 
    WHERE subscription_id = ? AND payment_type = 'deposit' AND status = 'paid'
  `).get(subscription_id);

  const downPaymentPaid = db.prepare(`
    SELECT SUM(amount) as total FROM payments 
    WHERE subscription_id = ? AND payment_type IN ('deposit', 'down_payment') AND status = 'paid'
  `).get(subscription_id);

  if (depositPaid.count > 0 && downPaymentPaid.total >= totalPrice * 0.3) {
    db.prepare(`
      UPDATE subscriptions SET status = 'contract_pending' WHERE id = ?
    `).run(subscription_id);
    updatePropertyStatus(subscription.property_id, 'contracting', '付款完成待签约', req.user.id);
  }

  res.json({ success: true, message: '收款成功' });
});

app.get('/api/payments', authenticateToken, (req, res) => {
  const payments = db.prepare(`
    SELECT p.*, s.customer_name, p.unit_number, b.name as building_name,
           u.name as operator_name
    FROM payments p
    LEFT JOIN subscriptions s ON p.subscription_id = s.id
    LEFT JOIN properties pr ON s.property_id = pr.id
    LEFT JOIN buildings b ON pr.building_id = b.id
    LEFT JOIN users u ON p.operator_id = u.id
    ORDER BY p.created_at DESC
  `).all();

  res.json(payments);
});

app.post('/api/contracts', authenticateToken, (req, res) => {
  const { subscription_id, contract_number, final_price } = req.body;

  const subscription = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subscription_id);
  if (!subscription || subscription.status !== 'contract_pending') {
    return res.status(400).json({ error: '认购单状态不正确' });
  }

  db.prepare(`
    INSERT INTO contracts (subscription_id, contract_number, final_price, status, signed_at)
    VALUES (?, ?, ?, 'signed', CURRENT_TIMESTAMP)
  `).run(subscription_id, contract_number, final_price || subscription.agreed_price);

  db.prepare("UPDATE subscriptions SET status = 'contracted' WHERE id = ?").run(subscription_id);
  updatePropertyStatus(subscription.property_id, 'contracted', '签约完成', req.user.id);

  res.json({ success: true, message: '签约完成' });
});

app.post('/api/refunds', authenticateToken, (req, res) => {
  const { subscription_id, amount, reason } = req.body;

  const subscription = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subscription_id);
  if (!subscription) {
    return res.status(400).json({ error: '认购单不存在' });
  }

  db.prepare(`
    INSERT INTO refunds (subscription_id, amount, reason, status, operator_id)
    VALUES (?, ?, ?, 'approved', ?)
  `).run(subscription_id, amount, reason, req.user.id);

  db.prepare("UPDATE subscriptions SET status = 'refunded' WHERE id = ?").run(subscription_id);
  updatePropertyStatus(subscription.property_id, 'available', '退房退款', req.user.id);

  res.json({ success: true, message: '退款成功' });
});

app.get('/api/statistics/sales', authenticateToken, (req, res) => {
  const stats = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count,
      SUM(p.base_price * p.area) / 10000 as total_value
    FROM properties p
    GROUP BY status
  `).all();

  const buildingStats = db.prepare(`
    SELECT 
      b.name as building_name,
      COUNT(*) as total,
      SUM(CASE WHEN p.status IN ('subscribed', 'contracted') THEN 1 ELSE 0 END) as sold
    FROM properties p
    LEFT JOIN buildings b ON p.building_id = b.id
    GROUP BY p.building_id
  `).all();

  res.json({ status_stats: stats, building_stats: buildingStats });
});

app.get('/api/users/consultants', authenticateToken, (req, res) => {
  const consultants = db.prepare(`
    SELECT id, name, username FROM users WHERE role = 'consultant'
  `).all();
  res.json(consultants);
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
