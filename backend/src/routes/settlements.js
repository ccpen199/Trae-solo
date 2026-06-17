const express = require('express');
const router = express.Router();
const db = require('../db/database');
const dayjs = require('dayjs');

function generateSettlementNo() {
  const now = dayjs();
  return `JS${now.format('YYYYMM')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
}

router.get('/', (req, res) => {
  const { merchant_id, platform_id, status, period, page = 1, pageSize = 20 } = req.query;
  
  let query = 'SELECT s.*, m.name as merchant_name, p.name as platform_name, p.logo as platform_logo FROM settlements s';
  query += ' LEFT JOIN merchants m ON s.merchant_id = m.id';
  query += ' LEFT JOIN platforms p ON s.platform_id = p.id';
  
  const where = [];
  const params = [];
  
  if (merchant_id) {
    where.push('s.merchant_id = ?');
    params.push(merchant_id);
  }
  if (platform_id) {
    where.push('s.platform_id = ?');
    params.push(platform_id);
  }
  if (status) {
    where.push('s.status = ?');
    params.push(status);
  }
  if (period) {
    where.push('s.period = ?');
    params.push(period);
  }
  
  if (where.length > 0) {
    query += ' WHERE ' + where.join(' AND ');
  }
  
  query += ' ORDER BY s.id DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize));
  params.push((parseInt(page) - 1) * parseInt(pageSize));
  
  const settlements = db.prepare(query).all(...params);
  
  let countQuery = 'SELECT COUNT(*) as total FROM settlements s';
  if (where.length > 0) {
    countQuery += ' WHERE ' + where.join(' AND ');
  }
  const { total } = db.prepare(countQuery).get(...params.slice(0, params.length - 2));
  
  res.json({ success: true, data: settlements, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', (req, res) => {
  const settlement = db.prepare(`
    SELECT s.*, m.name as merchant_name, p.name as platform_name, p.logo as platform_logo
    FROM settlements s
    LEFT JOIN merchants m ON s.merchant_id = m.id
    LEFT JOIN platforms p ON s.platform_id = p.id
    WHERE s.id = ?
  `).get(req.params.id);
  
  if (!settlement) {
    return res.status(404).json({ success: false, message: '结算单不存在' });
  }
  
  const items = db.prepare(`
    SELECT 
      o.id as id,
      o.id as order_id,
      o.order_no as order_no,
      o.total_fee as order_amount,
      o.distance as distance,
      o.goods_weight as weight,
      o.delivery_status as delivery_status,
      COALESCE(o.created_at, o.updated_at) as created_at,
      o.delivered_at as delivered_at,
      (o.total_fee - o.platform_fee) as commission_amount,
      o.platform_fee as platform_fee,
      (o.total_fee - (o.total_fee - o.platform_fee)) as settlement_amount
    FROM orders o
    WHERE o.platform_id = ?
      AND o.delivery_status IN ('delivered', 'delivering', 'picked', 'pending', 'assigned')
      AND (
        (o.created_at IS NOT NULL AND strftime('%Y-%m', o.created_at) = ?)
        OR
        (o.created_at IS NULL AND strftime('%Y-%m', o.updated_at) = ?)
      )
    ORDER BY COALESCE(o.created_at, o.updated_at) DESC
  `).all(settlement.platform_id, settlement.period, settlement.period);

  const orderIds = items.map(i => i.order_id);
  let compensations = [], afterSales = [];
  if (orderIds.length > 0) {
    const placeholders = orderIds.map(() => '?').join(',');
    compensations = db.prepare(`
      SELECT 
        c.*, o.order_no,
        p.name as platform_name, p.logo as platform_logo
      FROM compensations c
      LEFT JOIN orders o ON c.order_id = o.id
      LEFT JOIN platforms p ON o.platform_id = p.id
      WHERE c.order_id IN (${placeholders})
      ORDER BY c.triggered_at DESC
    `).all(...orderIds);
    
    afterSales = db.prepare(`
      SELECT 
        a.*, o.order_no,
        p.name as platform_name, p.logo as platform_logo
      FROM after_sales a
      LEFT JOIN orders o ON a.order_id = o.id
      LEFT JOIN platforms p ON o.platform_id = p.id
      WHERE a.order_id IN (${placeholders})
      ORDER BY a.created_at DESC
    `).all(...orderIds);
  }

  res.json({ success: true, data: { ...settlement, items, compensations, after_sales: afterSales } });
});

router.get('/summary/monthly', (req, res) => {
  const { merchant_id, platform_id } = req.query;
  
  let where = ["1=1"];
  let params = [];
  
  if (merchant_id) {
    where.push('s.merchant_id = ?');
    params.push(merchant_id);
  }
  if (platform_id) {
    where.push('s.platform_id = ?');
    params.push(platform_id);
  }
  
  const monthly = db.prepare(`
    SELECT 
      s.period as period,
      SUM(s.total_orders) as total_orders,
      SUM(s.settlement_amount) as total_platform_fee,
      SUM(s.total_amount) as total_amount,
      SUM(s.commission_amount) as total_commission,
      s.platform_id,
      p.name as platform_name,
      p.logo as platform_logo
    FROM settlements s
    LEFT JOIN platforms p ON s.platform_id = p.id
    WHERE ${where.join(' AND ')}
    GROUP BY period, s.platform_id
    ORDER BY period DESC
  `).all(...params);
  
  res.json({ success: true, data: monthly });
});

router.post('/generate', (req, res) => {
  const { period, merchant_id, platform_id } = req.body;
  
  if (!period) {
    return res.status(400).json({ success: false, message: '请指定结算周期' });
  }
  
  let where = ["o.delivery_status = 'delivered'", "strftime('%Y-%m', o.delivered_at) = ?"];
  let params = [period];
  
  if (merchant_id) {
    where.push('o.merchant_id = ?');
    params.push(merchant_id);
  }
  if (platform_id) {
    where.push('o.platform_id = ?');
    params.push(platform_id);
  }
  
  const orderGroups = db.prepare(`
    SELECT 
      o.merchant_id,
      o.platform_id,
      COUNT(*) as order_count,
      SUM(o.platform_fee) as total_platform_fee,
      SUM(o.total_fee) as total_amount,
      SUM(o.total_fee - o.platform_fee) as commission_amount
    FROM orders o
    WHERE ${where.join(' AND ')}
    GROUP BY o.merchant_id, o.platform_id
  `).all(...params);
  
  if (orderGroups.length === 0) {
    return res.status(400).json({ success: false, message: '该周期无待结算订单' });
  }
  
  const createdSettlements = [];
  
  for (const group of orderGroups) {
    const settlementNo = generateSettlementNo();
    const settlementAmount = group.total_platform_fee;
    const commissionAmount = group.commission_amount;
    
    const result = db.prepare(`
      INSERT INTO settlements (settlement_no, merchant_id, platform_id, period, 
        total_orders, total_amount, commission_amount, settlement_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(settlementNo, group.merchant_id, group.platform_id, period,
           group.order_count, group.total_amount, commissionAmount, settlementAmount, 'pending');
    
    const settlementId = result.lastInsertRowid;
    
    const orders = db.prepare(`
      SELECT id, total_fee, platform_fee 
      FROM orders 
      WHERE delivery_status = 'delivered' 
        AND strftime('%Y-%m', delivered_at) = ?
        AND merchant_id = ?
        AND platform_id = ?
    `).all(period, group.merchant_id, group.platform_id);
    
    const insertItem = db.prepare(`
      INSERT INTO settlement_items (settlement_id, order_id, order_amount, commission_amount)
      VALUES (?, ?, ?, ?)
    `);
    
    for (const order of orders) {
      insertItem.run(settlementId, order.id, order.platform_fee, order.total_fee - order.platform_fee);
    }
    
    const settlement = db.prepare(`
      SELECT s.*, m.name as merchant_name, p.name as platform_name
      FROM settlements s
      LEFT JOIN merchants m ON s.merchant_id = m.id
      LEFT JOIN platforms p ON s.platform_id = p.id
      WHERE s.id = ?
    `).get(settlementId);
    
    createdSettlements.push(settlement);
  }
  
  res.json({ 
    success: true, 
    data: createdSettlements,
    message: `已生成 ${createdSettlements.length} 条结算单`
  });
});

router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  const settlement = db.prepare('SELECT * FROM settlements WHERE id = ?').get(req.params.id);
  
  if (!settlement) {
    return res.status(404).json({ success: false, message: '结算单不存在' });
  }
  
  db.prepare('UPDATE settlements SET status = ? WHERE id = ?')
    .run(status, req.params.id);
  
  const updated = db.prepare(`
    SELECT s.*, m.name as merchant_name, p.name as platform_name, p.logo as platform_logo
    FROM settlements s
    LEFT JOIN merchants m ON s.merchant_id = m.id
    LEFT JOIN platforms p ON s.platform_id = p.id
    WHERE s.id = ?
  `).get(req.params.id);
  
  res.json({ success: true, data: updated });
});

module.exports = router;
