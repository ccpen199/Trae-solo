const express = require('express');
const db = require('../database');
const { authMiddleware, checkPermission } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

const generateSettlementNo = () => {
  const date = new Date();
  const dateStr = date.getFullYear().toString() + 
    (date.getMonth() + 1).toString().padStart(2, '0') + 
    date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString().slice(2, 6);
  return `SET${dateStr}${random}`;
};

router.get('/', checkPermission('settlement', 'report', 'all'), (req, res) => {
  const { status, order_no, page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = '1=1';
  const params = [];

  if (status) {
    whereClause += ' AND s.status = ?';
    params.push(status);
  }

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM settlements s WHERE ${whereClause}`);
  const { total } = countStmt.get(...params);

  let query = `
    SELECT s.*, 
           o.order_no, o.customer_name, o.origin_address, o.dest_address,
           o.total_distance, o.oil_consumption,
           v.plate_number, d.real_name as driver_name,
           u.real_name as settled_by_name
    FROM settlements s
    LEFT JOIN orders o ON s.order_id = o.id
    LEFT JOIN vehicles v ON s.vehicle_id = v.id
    LEFT JOIN drivers d ON s.driver_id = d.id
    LEFT JOIN users u ON s.settled_by = u.id
    WHERE ${whereClause}
  `;

  if (order_no) {
    query += ' AND o.order_no LIKE ?';
    params.push(`%${order_no}%`);
  }

  query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);

  const settlements = db.prepare(query).all(...params);

  res.json({
    data: settlements,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    }
  });
});

router.get('/:id', checkPermission('settlement', 'report', 'all'), (req, res) => {
  const settlement = db.prepare(`
    SELECT s.*, 
           o.order_no, o.customer_name, o.origin_address, o.dest_address,
           o.total_distance, o.oil_consumption, o.total_fee as order_fee,
           v.plate_number, v.vehicle_type,
           d.real_name as driver_name, d.phone as driver_phone,
           u.real_name as settled_by_name
    FROM settlements s
    LEFT JOIN orders o ON s.order_id = o.id
    LEFT JOIN vehicles v ON s.vehicle_id = v.id
    LEFT JOIN drivers d ON s.driver_id = d.id
    LEFT JOIN users u ON s.settled_by = u.id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!settlement) {
    return res.status(404).json({ message: '结算单不存在' });
  }

  res.json(settlement);
});

router.get('/order/:orderId/pending', checkPermission('settlement', 'all'), (req, res) => {
  const order = db.prepare(`
    SELECT o.*, v.plate_number, d.real_name as driver_name
    FROM orders o
    LEFT JOIN vehicles v ON o.vehicle_id = v.id
    LEFT JOIN drivers d ON o.driver_id = d.id
    WHERE o.id = ? AND o.status = 'completed'
  `).get(req.params.orderId);

  if (!order) {
    return res.status(404).json({ message: '订单不存在或未完成' });
  }

  const existingSettlement = db.prepare('SELECT * FROM settlements WHERE order_id = ?').get(req.params.orderId);
  
  if (existingSettlement) {
    return res.status(400).json({ message: '该订单已存在结算单' });
  }

  res.json({
    order_id: order.id,
    order_no: order.order_no,
    customer_name: order.customer_name,
    origin_address: order.origin_address,
    dest_address: order.dest_address,
    total_distance: order.total_distance,
    oil_consumption: order.oil_consumption,
    order_fee: order.total_fee,
    vehicle_id: order.vehicle_id,
    vehicle_plate: order.plate_number,
    driver_id: order.driver_id,
    driver_name: order.driver_name,
    actual_departure_time: order.actual_departure_time,
    actual_arrival_time: order.actual_arrival_time
  });
});

router.post('/', checkPermission('settlement', 'all'), (req, res) => {
  const {
    order_id, base_fee, distance_fee, oil_fee, toll_fee, other_fee,
    actual_payment, payment_method, remark
  } = req.body;

  if (!order_id) {
    return res.status(400).json({ message: '订单ID不能为空' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
  
  if (!order) {
    return res.status(404).json({ message: '订单不存在' });
  }

  if (order.status !== 'completed') {
    return res.status(400).json({ message: '只能对已完成订单进行结算' });
  }

  const existingSettlement = db.prepare('SELECT * FROM settlements WHERE order_id = ?').get(order_id);
  
  if (existingSettlement) {
    return res.status(400).json({ message: '该订单已存在结算单' });
  }

  const total_fee = (base_fee || 0) + (distance_fee || 0) + (oil_fee || 0) + 
                    (toll_fee || 0) + (other_fee || 0);

  const settlementNo = generateSettlementNo();

  try {
    const result = db.prepare(`
      INSERT INTO settlements (
        settlement_no, order_id, vehicle_id, driver_id,
        base_fee, distance_fee, oil_fee, toll_fee, other_fee, total_fee,
        actual_payment, payment_method, remark, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(settlementNo, order_id, order.vehicle_id, order.driver_id,
            base_fee || 0, distance_fee || 0, oil_fee || 0, toll_fee || 0, other_fee || 0, total_fee,
            actual_payment, payment_method, remark);

    res.json({ message: '结算单创建成功', id: result.lastInsertRowid, settlement_no: settlementNo, total_fee });
  } catch (error) {
    res.status(500).json({ message: '创建失败', error: error.message });
  }
});

router.put('/:id/settle', checkPermission('settlement', 'all'), (req, res) => {
  const { actual_payment, payment_method, remark } = req.body;
  const settlementId = req.params.id;

  const settlement = db.prepare('SELECT * FROM settlements WHERE id = ?').get(settlementId);
  
  if (!settlement) {
    return res.status(404).json({ message: '结算单不存在' });
  }

  if (settlement.status === 'settled') {
    return res.status(400).json({ message: '结算单已结算' });
  }

  try {
    db.prepare(`
      UPDATE settlements SET 
        actual_payment = ?, payment_method = ?, remark = ?, 
        status = 'settled', settled_at = CURRENT_TIMESTAMP, settled_by = ?
      WHERE id = ?
    `).run(actual_payment, payment_method, remark, req.user.id, settlementId);

    res.json({ message: '结算完成' });
  } catch (error) {
    res.status(500).json({ message: '结算失败', error: error.message });
  }
});

router.get('/statistics/summary', checkPermission('settlement', 'report', 'all'), (req, res) => {
  const { start_date, end_date } = req.query;

  let whereClause = '1=1';
  const params = [];

  if (start_date) {
    whereClause += ' AND date(s.created_at) >= ?';
    params.push(start_date);
  }
  if (end_date) {
    whereClause += ' AND date(s.created_at) <= ?';
    params.push(end_date);
  }

  const summary = db.prepare(`
    SELECT 
      COUNT(*) as total_count,
      IFNULL(SUM(CASE WHEN s.status = 'settled' THEN 1 ELSE 0 END), 0) as settled_count,
      IFNULL(SUM(CASE WHEN s.status = 'pending' THEN 1 ELSE 0 END), 0) as pending_count,
      IFNULL(SUM(s.total_fee), 0) as total_amount,
      IFNULL(SUM(CASE WHEN s.status = 'settled' THEN s.actual_payment ELSE 0 END), 0) as settled_amount,
      IFNULL(SUM(s.base_fee), 0) as total_base_fee,
      IFNULL(SUM(s.distance_fee), 0) as total_distance_fee,
      IFNULL(SUM(s.oil_fee), 0) as total_oil_fee,
      IFNULL(SUM(s.toll_fee), 0) as total_toll_fee,
      IFNULL(SUM(s.other_fee), 0) as total_other_fee
    FROM settlements s
    WHERE ${whereClause}
  `).get(...params);

  res.json(summary);
});

module.exports = router;
