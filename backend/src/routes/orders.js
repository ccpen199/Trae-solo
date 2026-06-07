import { Router } from 'express';
import { getDb } from '../db/index.js';
import { auth } from '../middleware/auth.js';
import { calculatePricing } from '../services/pricing.js';

const router = Router();

const VALID_TRANSITIONS = {
  pending: ['accepted', 'cancelled'],
  accepted: ['picking_up', 'cancelled'],
  picking_up: ['delivering', 'cancelled'],
  delivering: ['completed', 'cancelled'],
  completed: ['appealing'],
  appealing: [],
  cancelled: [],
};

function canTransition(from, to) {
  return VALID_TRANSITIONS[from]?.includes(to) || from === to;
}

router.post('/', (req, res) => {
  try {
    const {
      customer_name, customer_phone,
      pickup_address, pickup_lat, pickup_lng,
      delivery_address, delivery_lat, delivery_lng,
      item_description, item_weight, item_value,
      distance, time_sensitivity = 'standard',
      is_rain = false,
    } = req.body;

    if (!customer_name || !customer_phone || !pickup_address || !delivery_address) {
      return res.json({ code: 1, message: '缺少必要字段' });
    }

    const db = getDb();
    const configs = {};
    db.prepare('SELECT key, value FROM system_configs').all().forEach((c) => { configs[c.key] = c.value; });

    const pricing = calculatePricing({ distance: distance || 0, item_weight: item_weight || 0, time_sensitivity, is_rain }, configs);

    const order_no = 'ORD' + Date.now() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const now = new Date().toISOString();

    const result = db.prepare(`
      INSERT INTO orders (order_no, customer_name, customer_phone,
        pickup_address, pickup_lat, pickup_lng,
        delivery_address, delivery_lat, delivery_lng,
        item_description, item_weight, item_value, distance, time_sensitivity,
        pricing_base, pricing_distance, pricing_weight, pricing_time, pricing_night, pricing_rain, total_price,
        status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order_no, customer_name, customer_phone,
      pickup_address, pickup_lat, pickup_lng,
      delivery_address, delivery_lat, delivery_lng,
      item_description, item_weight, item_value, distance, time_sensitivity,
      pricing.base, pricing.distance_fee, pricing.weight_fee, pricing.time_surcharge, pricing.night_surcharge, pricing.rain_surcharge, pricing.total,
      'pending', now, now
    );

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
    res.json({ code: 0, data: order, message: '订单创建成功' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.get('/', auth, (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const db = getDb();
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let whereClause = '';
    const params = [];

    if (req.rider.role === 'admin') {
      if (status) {
        whereClause = 'WHERE o.status = ?';
        params.push(status);
      }
    } else {
      if (status) {
        whereClause = 'WHERE (o.rider_id = ? OR o.status = ?) AND o.status = ?';
        params.push(req.rider.id, 'pending', status);
      } else {
        whereClause = 'WHERE o.rider_id = ? OR o.status = ?';
        params.push(req.rider.id, 'pending');
      }
    }

    const total = db.prepare(`SELECT COUNT(*) as cnt FROM orders o ${whereClause}`).get(...params).cnt;
    const orders = db.prepare(`SELECT o.*, r.name as rider_name FROM orders o LEFT JOIN riders r ON o.rider_id = r.id ${whereClause} ORDER BY o.id DESC LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset);

    res.json({
      code: 0,
      data: { list: orders, total, page: parseInt(page), pageSize: parseInt(pageSize) },
      message: 'ok',
    });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.get('/nearby/list', auth, (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;
    if (!lat || !lng) {
      return res.json({ code: 1, message: '需要提供经纬度' });
    }
    const db = getDb();
    const orders = db.prepare(
      "SELECT * FROM orders WHERE status = 'pending' AND pickup_lat IS NOT NULL AND pickup_lng IS NOT NULL"
    ).all();

    const nearby = orders.filter((o) => {
      const dist = haversine(parseFloat(lat), parseFloat(lng), o.pickup_lat, o.pickup_lng);
      return dist <= parseFloat(radius);
    }).map((o) => {
      const dist = haversine(parseFloat(lat), parseFloat(lng), o.pickup_lat, o.pickup_lng);
      return { ...o, distance: Math.round(dist * 100) / 100 };
    }).sort((a, b) => a.distance - b.distance);

    res.json({ code: 0, data: nearby, message: 'ok' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare('SELECT o.*, r.name as rider_name FROM orders o LEFT JOIN riders r ON o.rider_id = r.id WHERE o.id = ?').get(req.params.id);
    if (!order) {
      return res.json({ code: 1, message: '订单不存在' });
    }
    res.json({ code: 0, data: order, message: 'ok' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.put('/:id/accept', auth, (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.json({ code: 1, message: '订单不存在' });
    if (!canTransition(order.status, 'accepted')) return res.json({ code: 1, message: `订单状态不能从 ${order.status} 变更为 accepted` });
    if (order.rider_id && order.rider_id !== req.rider.id) return res.json({ code: 1, message: '订单已被其他骑手接单' });

    const now = new Date().toISOString();
    db.prepare('UPDATE orders SET status = ?, rider_id = ?, updated_at = ? WHERE id = ?')
      .run('accepted', req.rider.id, now, req.params.id);

    db.prepare('INSERT INTO dispatch_logs (order_id, rider_id, match_score, dispatch_type, status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.params.id, req.rider.id, 0, 'manual', 'accepted', now);

    res.json({ code: 0, data: null, message: '接单成功' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.put('/:id/pickup', auth, (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.json({ code: 1, message: '订单不存在' });
    if (!canTransition(order.status, 'picking_up')) return res.json({ code: 1, message: `订单状态不能从 ${order.status} 变更为 picking_up` });

    const now = new Date().toISOString();
    db.prepare('UPDATE orders SET status = ?, pickup_time = ?, updated_at = ? WHERE id = ?')
      .run('picking_up', now, now, req.params.id);
    res.json({ code: 0, data: null, message: '已确认取件' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.put('/:id/deliver', auth, (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.json({ code: 1, message: '订单不存在' });
    if (!canTransition(order.status, 'delivering')) return res.json({ code: 1, message: `订单状态不能从 ${order.status} 变更为 delivering` });

    const now = new Date().toISOString();
    db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
      .run('delivering', now, req.params.id);
    res.json({ code: 0, data: null, message: '开始配送' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.put('/:id/complete', auth, (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.json({ code: 1, message: '订单不存在' });
    if (!canTransition(order.status, 'completed')) return res.json({ code: 1, message: `订单状态不能从 ${order.status} 变更为 completed` });

    const now = new Date().toISOString();
    db.prepare('UPDATE orders SET status = ?, delivery_time = ?, updated_at = ? WHERE id = ?')
      .run('completed', now, now, req.params.id);

    createSettlement(db, order, now);

    res.json({ code: 0, data: null, message: '配送完成' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.put('/:id/appeal', auth, (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.json({ code: 1, message: '订单不存在' });
    if (!canTransition(order.status, 'appealing')) return res.json({ code: 1, message: `订单状态不能从 ${order.status} 变更为 appealing` });

    const now = new Date().toISOString();
    db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
      .run('appealing', now, req.params.id);
    res.json({ code: 0, data: null, message: '已提交申诉' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

router.put('/:id/cancel', auth, (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.json({ code: 1, message: '订单不存在' });
    if (!canTransition(order.status, 'cancelled')) return res.json({ code: 1, message: `订单状态不能从 ${order.status} 变更为 cancelled` });

    const { cancel_reason } = req.body;
    const now = new Date().toISOString();
    db.prepare('UPDATE orders SET status = ?, cancel_reason = ?, updated_at = ? WHERE id = ?')
      .run('cancelled', cancel_reason || '', now, req.params.id);
    res.json({ code: 0, data: null, message: '订单已取消' });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

function createSettlement(db, order, now) {
  const configs = {};
  db.prepare('SELECT key, value FROM system_configs').all().forEach((c) => { configs[c.key] = c.value; });

  const amount = order.total_price || 0;
  const commission_rate = parseFloat(configs.commission_rate) || 0.15;
  const commission = Math.round(amount * commission_rate * 100) / 100;
  const insurance_fee = parseFloat(configs.insurance_fee_per_order) || 0.5;
  const tax_rate = parseFloat(configs.tax_rate) || 0.03;
  const tax = Math.round(amount * tax_rate * 100) / 100;
  const net_amount = Math.round((amount - commission - insurance_fee - tax) * 100) / 100;

  db.prepare(`
    INSERT INTO settlements (rider_id, order_id, amount, commission_rate, commission, insurance_fee, tax, net_amount, status, settled_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(order.rider_id, order.id, amount, commission_rate, commission, insurance_fee, tax, net_amount, 'settled', now, now);

  db.prepare('UPDATE riders SET balance = balance + ?, updated_at = ? WHERE id = ?')
    .run(net_amount, now, order.rider_id);
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) { return deg * (Math.PI / 180); }

export default router;
