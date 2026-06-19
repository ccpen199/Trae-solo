import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database.js';
import { authMiddleware, requireRoles, type AuthRequest } from '../middleware.js';

const router = express.Router();

router.post('/order/:orderId/quotations', authMiddleware, requireRoles('carrier'), (req: AuthRequest, res) => {
  try {
    const { 
      pickup_address, delivery_address, distance_km, weight_ton, 
      vehicle_type, quoted_price, estimated_days, insurance_fee 
    } = req.body;

    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.orderId) as any;
    if (!order) {
      res.status(404).json({ error: '订单不存在' });
      return;
    }

    const existing = db.prepare(`
      SELECT id FROM logistics_quotations 
      WHERE order_id = ? AND carrier_id = ? AND status = 'pending'
    `).get(req.params.orderId, req.user!.id);
    
    if (existing) {
      res.status(400).json({ error: '已提交过报价，请勿重复' });
      return;
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO logistics_quotations (
        id, order_id, carrier_id, carrier_enterprise_id,
        pickup_address, delivery_address, distance_km, weight_ton,
        vehicle_type, quoted_price, estimated_days, insurance_fee, expired_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+3 days'))
    `).run(
      id, req.params.orderId, req.user!.id, req.userEnterprise!.id,
      pickup_address, delivery_address, distance_km, weight_ton,
      vehicle_type, quoted_price, estimated_days, insurance_fee || 0
    );

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, content, related_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), order.seller_id, 'logistics',
      '收到新的物流报价',
      `${req.userEnterprise!.company_name} 提交了物流报价：${quoted_price} 元，预计 ${estimated_days} 天送达。`,
      id
    );

    res.status(201).json({ id, message: '物流报价已提交' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/order/:orderId/quotations', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.orderId) as any;
  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }
  if (order.buyer_id !== req.user!.id && order.seller_id !== req.user!.id) {
    res.status(403).json({ error: '无权访问' });
    return;
  }

  const quotations = db.prepare(`
    SELECT lq.*, e.company_name as carrier_name, e.credit_score, e.credit_rating,
           cp.vehicle_count, cp.service_regions
    FROM logistics_quotations lq
    JOIN enterprises e ON lq.carrier_enterprise_id = e.id
    JOIN carrier_profiles cp ON lq.carrier_id = cp.user_id
    WHERE lq.order_id = ?
    ORDER BY lq.quoted_price ASC
  `).all(req.params.orderId);

  res.json(quotations);
});

router.post('/quotations/:id/accept', authMiddleware, (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const quotation = db.prepare('SELECT * FROM logistics_quotations WHERE id = ?').get(req.params.id) as any;
    if (!quotation) {
      res.status(404).json({ error: '报价不存在' });
      return;
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(quotation.order_id) as any;
    if (order.seller_id !== req.user!.id) {
      res.status(403).json({ error: '只有卖方可以选择物流' });
      return;
    }
    if (quotation.status !== 'pending') {
      res.status(400).json({ error: '该报价已失效' });
      return;
    }

    const logisticsOrderId = uuidv4();
    const trackingNo = 'ZGY' + Date.now();

    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE logistics_quotations SET status = 'accepted' WHERE id = ?
      `).run(req.params.id);

      db.prepare(`
        UPDATE logistics_quotations SET status = 'rejected' 
        WHERE order_id = ? AND id != ?
      `).run(quotation.order_id, req.params.id);

      db.prepare(`
        INSERT INTO logistics_orders (
          id, order_id, quotation_id, carrier_id, tracking_no,
          vehicle_no, driver_name, driver_phone, status, estimated_arrival
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        logisticsOrderId, quotation.order_id, req.params.id, quotation.carrier_id,
        trackingNo, '京A·' + Math.floor(Math.random() * 90000 + 10000),
        '张师傅', '138' + Math.floor(Math.random() * 90000000 + 10000000),
        'pending_pickup',
        new Date(Date.now() + quotation.estimated_days * 24 * 3600 * 1000).toISOString()
      );

      db.prepare(`
        INSERT INTO logistics_events (id, logistics_order_id, status, location, description)
        VALUES (?, ?, '待揽收', ?, ?)
      `).run(uuidv4(), logisticsOrderId, quotation.pickup_address, '订单已生成，等待承运商上门揽件');

      db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run('shipping', quotation.order_id);
    });

    transaction();

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, content, related_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), quotation.carrier_id, 'logistics',
      '物流报价已被采纳',
      `您的物流报价已被选择，运单号 ${trackingNo}，请及时安排车辆上门揽件。`,
      logisticsOrderId
    );

    res.json({ 
      logistics_order_id: logisticsOrderId, 
      tracking_no: trackingNo,
      message: '已选择物流方案，承运商已收到通知' 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/carrier/orders', authMiddleware, requireRoles('carrier'), (req: AuthRequest, res) => {
  const db = getDb();
  const orders = db.prepare(`
    SELECT lo.*, lq.quoted_price, lq.pickup_address, lq.delivery_address, lq.estimated_days,
           o.total_amount, o.status as order_status,
           c.category, c.sub_category, c.quantity, c.unit,
           eb.company_name as buyer_name,
           es.company_name as seller_name,
           (SELECT COUNT(*) FROM logistics_events WHERE logistics_order_id = lo.id) as event_count
    FROM logistics_orders lo
    JOIN logistics_quotations lq ON lo.quotation_id = lq.id
    JOIN orders o ON lo.order_id = o.id
    JOIN contracts c ON o.contract_id = c.id
    JOIN enterprises eb ON o.buyer_id = eb.user_id
    JOIN enterprises es ON o.seller_id = es.user_id
    WHERE lo.carrier_id = ?
    ORDER BY lo.created_at DESC
  `).all(req.user!.id);

  res.json(orders);
});

router.post('/logistics/:id/update', authMiddleware, requireRoles('carrier'), (req: AuthRequest, res) => {
  try {
    const { status, location, description, current_location } = req.body;
    const db = getDb();
    const logisticsOrder = db.prepare('SELECT * FROM logistics_orders WHERE id = ?').get(req.params.id) as any;
    if (!logisticsOrder) {
      res.status(404).json({ error: '物流单不存在' });
      return;
    }
    if (logisticsOrder.carrier_id !== req.user!.id) {
      res.status(403).json({ error: '无权操作此物流单' });
      return;
    }

    db.prepare(`
      UPDATE logistics_orders 
      SET status = COALESCE(?, status),
          current_location = COALESCE(?, current_location),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(status || null, current_location || null, req.params.id);

    if (status) {
      db.prepare(`
        INSERT INTO logistics_events (id, logistics_order_id, status, location, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), req.params.id, status, location || logisticsOrder.current_location || '运输途中', description || status);
    }

    const order = db.prepare('SELECT buyer_id, seller_id FROM orders WHERE id = ?').get(logisticsOrder.order_id) as any;
    if (status === 'delivered') {
      db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run('inspecting', logisticsOrder.order_id);
      db.prepare('UPDATE trace_codes SET status = ?, updated_at = datetime(\'now\') WHERE order_id = ?').run('received', logisticsOrder.order_id);
    }

    const statusMap: Record<string, string> = {
      picked_up: '已揽收',
      in_transit: '运输中',
      delivered: '已送达',
      exception: '异常'
    };

    [order.buyer_id, order.seller_id].forEach(uid => {
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, content, related_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), uid, 'logistics',
        `物流状态更新：${statusMap[status] || status}`,
        `运单号 ${logisticsOrder.tracking_no}，${description || status}，${location || '当前位置已更新'}。`,
        logisticsOrder.order_id
      );
    });

    res.json({ message: '物流状态已更新' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tracking/:trackingNo', authMiddleware, (req, res) => {
  const db = getDb();
  const logistics = db.prepare(`
    SELECT lo.*, lq.quoted_price, lq.pickup_address, lq.delivery_address,
           lq.distance_km, lq.weight_ton, lq.vehicle_type, lq.estimated_days,
           e.company_name as carrier_name,
           o.id as order_id, o.status as order_status,
           c.category, c.sub_category
    FROM logistics_orders lo
    JOIN logistics_quotations lq ON lo.quotation_id = lq.id
    JOIN orders o ON lo.order_id = o.id
    JOIN contracts c ON o.contract_id = c.id
    JOIN carrier_profiles cp ON lo.carrier_id = cp.user_id
    JOIN enterprises e ON cp.enterprise_id = e.id
    WHERE lo.tracking_no = ?
  `).get(req.params.trackingNo) as any;

  if (!logistics) {
    res.status(404).json({ error: '运单号不存在' });
    return;
  }

  const events = db.prepare(`
    SELECT * FROM logistics_events 
    WHERE logistics_order_id = ? 
    ORDER BY event_time DESC
  `).all(logistics.id);

  res.json({ logistics, events });
});

export default router;
