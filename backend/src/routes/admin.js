const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.user.type !== 'enterprise') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}

router.use(authenticateToken, requireAdmin);

router.get('/products/review', (req, res) => {
  const db = getDb();
  const products = db.prepare(`
    SELECT p.*, 
      CASE WHEN cr.id IS NOT NULL THEN cr.status ELSE p.status END as review_status,
      cr.comments
    FROM products p
    LEFT JOIN content_reviews cr ON p.id = cr.product_id
    WHERE p.status = 'pending' OR cr.status = 'pending'
    ORDER BY p.created_at DESC
  `).all();
  
  res.json({ products });
});

router.post('/products/:id/review', (req, res) => {
  const { status, comments } = req.body;
  const db = getDb();
  
  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO content_reviews (product_id, reviewer_id, status, comments)
      VALUES (?, ?, ?, ?)
    `).run(req.params.id, req.user.id, status, comments);
    
    db.prepare('UPDATE products SET status = ? WHERE id = ?').run(status, req.params.id);
  });
  
  try {
    transaction();
    res.json({ message: '审核完成' });
  } catch (err) {
    res.status(500).json({ error: '审核失败' });
  }
});

router.get('/subscriptions/health', (req, res) => {
  const db = getDb();
  
  const totalSubs = db.prepare('SELECT COUNT(*) as count FROM subscriptions').get().count;
  const activeSubs = db.prepare("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'").get().count;
  const expiringSubs = db.prepare(`
    SELECT COUNT(*) as count FROM subscriptions 
    WHERE status = 'active' 
    AND end_date IS NOT NULL 
    AND date(end_date) <= date('now', '+30 days')
  `).get().count;
  
  const renewalRate = totalSubs > 0 ? ((activeSubs / totalSubs) * 100).toFixed(1) : 0;
  
  const topProducts = db.prepare(`
    SELECT p.name, COUNT(s.id) as subscription_count
    FROM subscriptions s
    JOIN products p ON s.product_id = p.id
    GROUP BY s.product_id
    ORDER BY subscription_count DESC
    LIMIT 10
  `).all();
  
  res.json({
    overview: {
      total: totalSubs,
      active: activeSubs,
      expiring: expiringSubs,
      renewalRate: parseFloat(renewalRate)
    },
    topProducts
  });
});

router.get('/address-changes', (req, res) => {
  const db = getDb();
  const changes = db.prepare(`
    SELECT ac.*, s.user_id, p.name as product_name, u.username
    FROM address_changes ac
    JOIN subscriptions s ON ac.subscription_id = s.id
    JOIN products p ON s.product_id = p.id
    JOIN users u ON s.user_id = u.id
    WHERE ac.status = 'pending'
    ORDER BY ac.created_at DESC
  `).all();
  
  res.json({ changes });
});

router.post('/address-changes/:id/approve', (req, res) => {
  const { approved } = req.body;
  const db = getDb();
  
  const change = db.prepare('SELECT * FROM address_changes WHERE id = ?').get(req.params.id);
  
  if (!change) {
    return res.status(404).json({ error: '申请不存在' });
  }
  
  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE address_changes 
      SET status = ?, approved_by = ?
      WHERE id = ?
    `).run(approved ? 'approved' : 'rejected', req.user.id, req.params.id);
    
    if (approved) {
      db.prepare(`
        UPDATE subscriptions 
        SET delivery_address = ?
        WHERE id = ?
      `).run(change.new_address, change.subscription_id);
    }
  });
  
  try {
    transaction();
    res.json({ message: approved ? '已批准' : '已拒绝' });
  } catch (err) {
    res.status(500).json({ error: '操作失败' });
  }
});

router.get('/outlets', (req, res) => {
  const db = getDb();
  const outlets = db.prepare('SELECT * FROM post_outlets ORDER BY created_at DESC').all();
  res.json({ outlets });
});

router.post('/outlets', (req, res) => {
  const { name, address, city, phone, business_hours, delivery_area } = req.body;
  const db = getDb();
  
  try {
    const result = db.prepare(`
      INSERT INTO post_outlets (name, address, city, phone, business_hours, delivery_area)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, address, city, phone, business_hours, delivery_area);
    
    res.json({ id: result.lastInsertRowid, message: '网点创建成功' });
  } catch (err) {
    res.status(500).json({ error: '创建失败' });
  }
});

router.get('/tickets', (req, res) => {
  const db = getDb();
  const tickets = db.prepare(`
    SELECT t.*, u.username
    FROM tickets t
    JOIN users u ON t.user_id = u.id
    ORDER BY 
      CASE t.status WHEN 'open' THEN 1 WHEN 'processing' THEN 2 ELSE 3 END,
      t.created_at DESC
  `).all();
  
  res.json({ tickets });
});

router.put('/tickets/:id/assign', (req, res) => {
  const db = getDb();
  
  db.prepare('UPDATE tickets SET assigned_to = ?, status = ? WHERE id = ?').run(req.user.id, 'processing', req.params.id);
  
  res.json({ message: '工单已分配' });
});

router.get('/ads', (req, res) => {
  const db = getDb();
  const ads = db.prepare('SELECT * FROM ad_spots ORDER BY created_at DESC').all();
  res.json({ ads });
});

router.post('/ads', (req, res) => {
  const { name, location, image, link } = req.body;
  const db = getDb();
  
  try {
    const result = db.prepare(`
      INSERT INTO ad_spots (name, location, image, link)
      VALUES (?, ?, ?, ?)
    `).run(name, location, image, link);
    
    res.json({ id: result.lastInsertRowid, message: '广告位创建成功' });
  } catch (err) {
    res.status(500).json({ error: '创建失败' });
  }
});

router.post('/ads/:id/track', (req, res) => {
  const { type } = req.body;
  const db = getDb();
  
  if (type === 'click') {
    db.prepare('UPDATE ad_spots SET clicks = clicks + 1 WHERE id = ?').run(req.params.id);
  } else if (type === 'impression') {
    db.prepare('UPDATE ad_spots SET impressions = impressions + 1 WHERE id = ?').run(req.params.id);
  }
  
  res.json({ message: '已记录' });
});

router.get('/stamps', (req, res) => {
  const db = getDb();
  const stamps = db.prepare(`
    SELECT ds.*, u.username
    FROM digital_stamps ds
    JOIN users u ON ds.user_id = u.id
    ORDER BY ds.issued_at DESC
  `).all();
  
  res.json({ stamps });
});

router.post('/stamps/issue', authenticateToken, (req, res) => {
  const { design } = req.body;
  const db = getDb();
  
  const stampCode = 'STAMP' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
  
  try {
    const result = db.prepare(`
      INSERT INTO digital_stamps (user_id, stamp_code, design)
      VALUES (?, ?, ?)
    `).run(req.user.id, stampCode, design);
    
    res.json({ id: result.lastInsertRowid, stamp_code: stampCode, message: '电子邮戳签发成功' });
  } catch (err) {
    res.status(500).json({ error: '签发失败' });
  }
});

router.get('/nft', (req, res) => {
  const db = getDb();
  const nfts = db.prepare(`
    SELECT nc.*, u.username
    FROM nft_collectibles nc
    LEFT JOIN users u ON nc.user_id = u.id
    ORDER BY nc.created_at DESC
  `).all();
  
  res.json({ nfts });
});

router.post('/nft/mint', authenticateToken, (req, res) => {
  const { name, description, image } = req.body;
  const db = getDb();
  
  const tokenId = 'NFT' + Date.now() + Math.random().toString(36).substr(2, 8).toUpperCase();
  
  try {
    const result = db.prepare(`
      INSERT INTO nft_collectibles (user_id, name, description, token_id, image)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, name, description, tokenId, image);
    
    res.json({ id: result.lastInsertRowid, token_id: tokenId, message: '数字藏品铸造成功' });
  } catch (err) {
    res.status(500).json({ error: '铸造失败' });
  }
});

router.get('/dashboard', (req, res) => {
  const db = getDb();
  
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const ticketCount = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'open'").get().count;
  
  const recentOrders = db.prepare(`
    SELECT o.*, u.username
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
    LIMIT 10
  `).all();
  
  const salesByCategory = db.prepare(`
    SELECT p.category, SUM(oi.quantity * oi.price) as total_sales
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    GROUP BY p.category
  `).all();
  
  res.json({
    stats: {
      userCount,
      productCount,
      orderCount,
      pendingTickets: ticketCount
    },
    recentOrders,
    salesByCategory
  });
});

module.exports = router;
