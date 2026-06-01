const express = require('express');
const router = express.Router();
const db = require('../database');
const crypto = require('crypto');

router.get('/products', (req, res) => {
  const { active } = req.query;

  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (active !== undefined) {
    sql += ' AND is_active = ?';
    params.push(active === 'true' ? 1 : 0);
  }

  sql += ' ORDER BY id DESC';
  const products = db.prepare(sql).all(...params);

  res.json(products);
});

router.get('/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }

  res.json(product);
});

router.post('/products', (req, res) => {
  const { name, description, image, points_required, stock, max_per_resident } = req.body;

  if (!name || !points_required) {
    return res.status(400).json({ error: '参数不完整' });
  }

  const result = db.prepare(`
    INSERT INTO products (name, description, image, points_required, stock, max_per_resident, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(name, description || null, image || null, points_required, stock || 0, max_per_resident || 1);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.json(product);
});

router.put('/products/:id', (req, res) => {
  const { name, description, image, points_required, stock, max_per_resident, is_active } = req.body;

  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }

  db.prepare(`
    UPDATE products
    SET name = ?, description = ?, image = ?, points_required = ?, stock = ?, max_per_resident = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, description || null, image || null, points_required, stock || 0, max_per_resident || 1, is_active !== undefined ? (is_active ? 1 : 0) : 1, req.params.id);

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.post('/redeem', (req, res) => {
  const { resident_id, product_id, quantity = 1 } = req.body;

  const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(product_id);
  if (!product) {
    return res.status(404).json({ error: '商品不存在或已下架' });
  }

  if (product.stock < quantity) {
    return res.status(400).json({ error: '库存不足' });
  }

  const account = db.prepare('SELECT * FROM point_accounts WHERE resident_id = ?').get(resident_id);
  if (!account) {
    return res.status(404).json({ error: '居民积分账户不存在' });
  }

  const totalPoints = product.points_required * quantity;
  if (account.available_points < totalPoints) {
    return res.status(400).json({ error: '积分不足' });
  }

  const exchangeCount = db.prepare(`
    SELECT COUNT(*) as count FROM exchanges
    WHERE resident_id = ? AND product_id = ? AND status != 'cancelled'
  `).get(resident_id, product_id).count;

  if (exchangeCount + quantity > product.max_per_resident) {
    return res.status(400).json({ error: '超出兑换限制' });
  }

  const verificationCode = crypto.randomBytes(4).toString('hex').toUpperCase();

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE products
      SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(quantity, product_id);

    db.prepare(`
      UPDATE point_accounts
      SET available_points = available_points - ?, updated_at = CURRENT_TIMESTAMP
      WHERE resident_id = ?
    `).run(totalPoints, resident_id);

    db.prepare(`
      INSERT INTO point_transactions (resident_id, account_id, type, points, balance_before, balance_after, reason, source_type, source_id)
      VALUES (?, ?, 'spend', -?, ?, ?, ?, 'exchange', ?)
    `).run(resident_id, account.id, totalPoints, account.available_points, account.available_points - totalPoints, `兑换: ${product.name}`, product_id);

    db.prepare(`
      INSERT INTO exchanges (resident_id, product_id, quantity, points_spent, status, verification_code)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `).run(resident_id, product_id, quantity, totalPoints, verificationCode);
  });

  transaction();

  const exchange = db.prepare(`
    SELECT e.*, p.name as product_name, p.points_required
    FROM exchanges e
    JOIN products p ON e.product_id = p.id
    WHERE e.resident_id = ? AND e.product_id = ?
    ORDER BY e.id DESC
    LIMIT 1
  `).get(resident_id, product_id);

  res.json(exchange);
});

router.get('/exchanges', (req, res) => {
  const { page = 1, pageSize = 20, resident_id, status } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = `
    SELECT e.*, p.name as product_name, r.name as resident_name, r.phone as resident_phone
    FROM exchanges e
    JOIN products p ON e.product_id = p.id
    JOIN residents r ON e.resident_id = r.id
    WHERE 1=1
  `;
  const params = [];

  if (resident_id) {
    sql += ' AND e.resident_id = ?';
    params.push(resident_id);
  }

  if (status) {
    sql += ' AND e.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY e.id DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);

  const exchanges = db.prepare(sql).all(...params);

  let countSql = 'SELECT COUNT(*) as total FROM exchanges WHERE 1=1';
  const countParams = [];
  if (resident_id) {
    countSql += ' AND resident_id = ?';
    countParams.push(resident_id);
  }
  if (status) {
    countSql += ' AND status = ?';
    countParams.push(status);
  }
  const { total } = db.prepare(countSql).get(...countParams);

  res.json({ data: exchanges, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.post('/exchanges/:id/redeem', (req, res) => {
  const { redeemed_by, verification_code } = req.body;

  const exchange = db.prepare('SELECT * FROM exchanges WHERE id = ?').get(req.params.id);
  if (!exchange) {
    return res.status(404).json({ error: '兑换记录不存在' });
  }

  if (exchange.status !== 'pending') {
    return res.status(400).json({ error: '该兑换已核销或已取消' });
  }

  if (exchange.verification_code !== verification_code) {
    return res.status(400).json({ error: '核销码错误' });
  }

  db.prepare(`
    UPDATE exchanges
    SET status = 'redeemed', redeemed_by = ?, redeemed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(redeemed_by || 'admin', req.params.id);

  const updated = db.prepare(`
    SELECT e.*, p.name as product_name, r.name as resident_name
    FROM exchanges e
    JOIN products p ON e.product_id = p.id
    JOIN residents r ON e.resident_id = r.id
    WHERE e.id = ?
  `).get(req.params.id);

  res.json(updated);
});

router.post('/exchanges/:id/cancel', (req, res) => {
  const exchange = db.prepare('SELECT * FROM exchanges WHERE id = ?').get(req.params.id);
  if (!exchange) {
    return res.status(404).json({ error: '兑换记录不存在' });
  }

  if (exchange.status !== 'pending') {
    return res.status(400).json({ error: '只能取消待核销的兑换' });
  }

  const transaction = db.transaction(() => {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(exchange.product_id);

    db.prepare(`
      UPDATE products
      SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(exchange.quantity, exchange.product_id);

    const account = db.prepare('SELECT * FROM point_accounts WHERE resident_id = ?').get(exchange.resident_id);

    db.prepare(`
      UPDATE point_accounts
      SET available_points = available_points + ?, updated_at = CURRENT_TIMESTAMP
      WHERE resident_id = ?
    `).run(exchange.points_spent, exchange.resident_id);

    db.prepare(`
      INSERT INTO point_transactions (resident_id, account_id, type, points, balance_before, balance_after, reason, source_type, source_id)
      VALUES (?, ?, 'refund', ?, ?, ?, ?, 'exchange', ?)
    `).run(exchange.resident_id, account.id, exchange.points_spent, account.available_points, account.available_points + exchange.points_spent, `取消兑换: ${product.name}`, exchange.id);

    db.prepare(`
      UPDATE exchanges
      SET status = 'cancelled'
      WHERE id = ?
    `).run(req.params.id);
  });

  transaction();

  res.json({ success: true });
});

module.exports = router;
