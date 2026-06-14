const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const LEVEL_THRESHOLDS = [0, 1000, 5000, 20000, 50000, 100000];
const LEVEL_NAMES = ['普通会员', '银卡会员', '金卡会员', '铂金会员', '钻石会员', '至尊会员'];
const LEVEL_BENEFITS = [
  { level: 1, name: '普通会员', benefits: ['基础乘车服务', '积分累计1倍'] },
  { level: 2, name: '银卡会员', benefits: ['基础乘车服务', '积分累计1.2倍', '生日当月积分翻倍', '客服优先接入'] },
  { level: 3, name: '金卡会员', benefits: ['基础乘车服务', '积分累计1.5倍', '生日当月积分翻倍', '客服优先接入', '每月免费2次超时补登', '地铁商户专享折扣'] },
  { level: 4, name: '铂金会员', benefits: ['基础乘车服务', '积分累计2倍', '生日当月积分翻倍', '客服优先接入', '每月免费5次超时补登', '地铁商户专享折扣', '活动优先报名', '专属客服经理'] },
  { level: 5, name: '钻石会员', benefits: ['基础乘车服务', '积分累计2.5倍', '生日当月积分翻倍', '客服优先接入', '每月免费10次超时补登', '地铁商户专享折扣', '活动优先报名', '专属客服经理', '年度免费乘车卡一张'] },
  { level: 6, name: '至尊会员', benefits: ['基础乘车服务', '积分累计3倍', '生日当月积分翻倍', '客服优先接入', '无限次超时补登', '地铁商户专享折扣', '活动优先报名', '专属客服经理', '年度免费乘车卡两张', '定制专属卡号', '高端生活服务专属通道'] }
];

function calculateLevel(totalPoints) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

router.get('/my-points', authenticateToken, (req, res) => {
  let points = db.prepare('SELECT * FROM user_points WHERE user_id = ?').get(req.user.id);
  
  if (!points) {
    db.prepare('INSERT INTO user_points (user_id, points, level, total_points, total_earned, total_spent, monthly_rides) VALUES (?, 0, 1, 0, 0, 0, 0)').run(req.user.id);
    points = db.prepare('SELECT * FROM user_points WHERE user_id = ?').get(req.user.id);
  }
  
  const currentLevel = calculateLevel(points.total_points);
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const progress = currentLevel < LEVEL_THRESHOLDS.length 
    ? Math.floor((points.total_points - LEVEL_THRESHOLDS[currentLevel - 1]) / (nextThreshold - LEVEL_THRESHOLDS[currentLevel - 1]) * 100)
    : 100;
  
  const benefits = LEVEL_BENEFITS.find(b => b.level === currentLevel) || LEVEL_BENEFITS[0];
  
  const recentTransactions = db.prepare(`
    SELECT COUNT(*) as count 
    FROM transactions 
    WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
  `).get(req.user.id);
  
  res.success({
    user_id: points.user_id,
    available_points: points.points || 0,
    total_points: points.total_points || 0,
    total_earned: points.total_earned || 0,
    total_spent: points.total_spent || 0,
    level: currentLevel,
    level_name: LEVEL_NAMES[currentLevel - 1],
    next_threshold: nextThreshold,
    level_progress: progress,
    benefits: benefits.benefits,
    level_info: benefits,
    monthly_rides: recentTransactions.count || 0,
    created_at: points.created_at
  }, '获取成功');
});

router.get('/history', authenticateToken, (req, res) => {
  const { page = 1, page_size = 20 } = req.query;
  const offset = (page - 1) * page_size;
  
  const history = db.prepare(`
    SELECT * FROM point_history 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).all(req.user.id, parseInt(page_size), offset);
  
  const total = db.prepare('SELECT COUNT(*) as count FROM point_history WHERE user_id = ?').get(req.user.id).count;
  
  res.success({
    list: history,
    total,
    page: parseInt(page),
    page_size: parseInt(page_size)
  }, '获取成功');
});

router.get('/products', (req, res) => {
  const { category, keyword } = req.query;
  
  let sql = 'SELECT * FROM point_products WHERE status = 1';
  const params = [];
  
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  
  if (keyword) {
    sql += ' AND (product_name LIKE ? OR description LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw);
  }
  
  sql += ' ORDER BY points_cost ASC';
  
  const products = db.prepare(sql).all(...params);
  
  res.success(products, '获取成功');
});

router.post('/products/:id/exchange', authenticateToken, (req, res) => {
  const productId = req.params.id;
  const { shipping_info } = req.body;
  
  const product = db.prepare('SELECT * FROM point_products WHERE id = ? AND status = 1').get(productId);
  
  if (!product) {
    return res.error('商品不存在', 404);
  }
  
  if (product.stock <= 0) {
    return res.error('库存不足', 400);
  }
  
  const userPoints = db.prepare('SELECT * FROM user_points WHERE user_id = ?').get(req.user.id);
  
  if (!userPoints || userPoints.points < product.points_cost) {
    return res.error('积分不足', 400);
  }
  
  const orderNo = 'PO' + Date.now().toString() + Math.floor(Math.random() * 1000);
  
  db.prepare('BEGIN TRANSACTION');
  
  try {
    db.prepare(`
      INSERT INTO point_orders (order_no, user_id, product_id, points_cost, shipping_info, status)
      VALUES (?, ?, ?, ?, ?, 'success')
    `).run(orderNo, req.user.id, productId, product.points_cost, shipping_info || '');
    
    db.prepare('UPDATE user_points SET points = points - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
      .run(product.points_cost, req.user.id);
    
    db.prepare('UPDATE point_products SET stock = stock - 1 WHERE id = ?')
      .run(productId);
    
    db.prepare(`
      INSERT INTO point_history (user_id, points, type, reason)
      VALUES (?, ?, 'spend', ?)
    `).run(req.user.id, -product.points_cost, `兑换${product.product_name}`);
    
    db.prepare('COMMIT');
    
    res.success({
      order_no: orderNo,
      product: product,
      points_cost: product.points_cost,
      points_balance: userPoints.points - product.points_cost
    }, '兑换成功');
  } catch (e) {
    db.prepare('ROLLBACK');
    return res.error('兑换失败: ' + e.message, 500);
  }
});

router.get('/my-orders', authenticateToken, (req, res) => {
  const orders = db.prepare(`
    SELECT po.*, pp.product_name, pp.description, pp.category
    FROM point_orders po
    LEFT JOIN point_products pp ON po.product_id = pp.id
    WHERE po.user_id = ?
    ORDER BY po.created_at DESC
  `).all(req.user.id);
  
  res.success(orders, '获取成功');
});

router.get('/level-benefits', (req, res) => {
  res.success(LEVEL_BENEFITS, '获取成功');
});

module.exports = router;
