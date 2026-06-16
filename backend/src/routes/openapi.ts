import { Router } from 'express';
import db from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

function formatDate(d: Date) { return d.toISOString().slice(0, 19).replace('T', ' '); }

router.get('/brands', (_req, res) => {
  const list = db.prepare("SELECT id, code, name, base_price, per_kg_price, avg_delivery_hours, coverage_score, rating FROM courier_brands WHERE api_status = 'active' ORDER BY rating DESC").all();
  res.json({ code: 0, data: list });
});

router.post('/orders', (req, res) => {
  const { sender, receiver, goods, brand_id } = req.body;
  if (!sender || !receiver) return res.status(400).json({ code: 400, message: '收寄件人信息必填' });
  const brand = db.prepare('SELECT * FROM courier_brands WHERE id = ? AND api_status = ?').get(brand_id || 1, 'active') as any;
  if (!brand) return res.status(400).json({ code: 400, message: '无效品牌' });
  const couriers = db.prepare("SELECT * FROM couriers WHERE brand_id = ? AND work_status = 'online' LIMIT 5").all(brand.id) as any[];
  if (!couriers.length) return res.status(503).json({ code: 503, message: '无可用快递员' });
  const courier = couriers[Math.floor(Math.random() * couriers.length)];
  const now = new Date();
  const orderNo = `EXP${formatDate(now).replace(/[-: ]/g, '')}${uuidv4().slice(0, 6).toUpperCase()}`;
  const trackingNo = `${brand.code}${orderNo.slice(3)}`;
  const weight = +(goods?.weight || 1).toFixed(2);
  const price = +(brand.base_price + brand.per_kg_price * Math.max(0, weight - 1)).toFixed(2);
  const est = new Date(now.getTime() + brand.avg_delivery_hours * 3600000);

  const info = db.prepare(`INSERT INTO shipment_orders (order_no, tracking_no, brand_id, courier_id, sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address, weight, goods_name, price, total_amount, estimated_delivery_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    orderNo, trackingNo, brand.id, courier.id,
    sender.name, sender.phone, sender.address,
    receiver.name, receiver.phone, receiver.address,
    weight, goods?.name || '标准快递', price, price, formatDate(est), 'created'
  );
  db.prepare("INSERT INTO tracking_events (order_id, tracking_no, event_type, event_desc, created_at) VALUES (?, ?, 'ORDER_CREATED', 'API订单已创建', ?)").run(info.lastInsertRowid, trackingNo, formatDate(now));
  res.json({ code: 0, data: { order_id: info.lastInsertRowid, order_no: orderNo, tracking_no: trackingNo, price, estimated_delivery: formatDate(est), courier: { name: courier.name, phone: courier.phone } } });
});

router.get('/orders/:trackingNo/tracking', (req, res) => {
  const order = db.prepare('SELECT id, order_no, tracking_no, status, estimated_delivery_time, actual_delivery_time FROM shipment_orders WHERE tracking_no = ?').get(req.params.trackingNo) as any;
  if (!order) return res.status(404).json({ code: 404, message: '运单号不存在' });
  const events = db.prepare('SELECT event_type, event_desc, location, longitude, latitude, operator_name, is_exception, exception_type, created_at FROM tracking_events WHERE tracking_no = ? ORDER BY created_at ASC').all(req.params.trackingNo);
  res.json({ code: 0, data: { ...order, events } });
});

router.get('/orders/batch', (req, res) => {
  const { tracking_nos } = req.query as any;
  const nos = (tracking_nos || '').split(',').filter(Boolean);
  if (!nos.length) return res.status(400).json({ code: 400, message: '请传入tracking_nos' });
  const placeholders = nos.map(() => '?').join(',');
  const list = db.prepare(`SELECT o.order_no, o.tracking_no, o.status, o.estimated_delivery_time, o.actual_delivery_time, b.name brand_name FROM shipment_orders o LEFT JOIN courier_brands b ON o.brand_id = b.id WHERE o.tracking_no IN (${placeholders})`).all(...nos);
  res.json({ code: 0, data: list });
});

router.post('/price/compare', (req, res) => {
  const { sender_city, receiver_city, weight = 1 } = req.body;
  const brands = db.prepare("SELECT * FROM courier_brands WHERE api_status = 'active'").all() as any[];
  const results = brands.map(b => {
    const w = +weight;
    const price = +(b.base_price + b.per_kg_price * Math.max(0, w - 1)).toFixed(2);
    return { brand_id: b.id, brand_code: b.code, brand_name: b.name, price, estimated_hours: b.avg_delivery_hours, coverage_score: b.coverage_score, rating: b.rating };
  }).sort((a, b) => a.price - b.price);
  res.json({ code: 0, data: { sender_city, receiver_city, weight, list: results } });
});

router.get('/couriers/available', (req, res) => {
  const { brand_id, city } = req.query as any;
  let sql = "SELECT c.id, c.name, c.phone, c.rating, c.work_status, c.service_area, b.code brand_code, b.name brand_name FROM couriers c LEFT JOIN courier_brands b ON c.brand_id = b.id WHERE c.work_status = 'online'";
  const params: any[] = [];
  if (brand_id) { sql += ' AND c.brand_id = ?'; params.push(brand_id); }
  if (city) { sql += ' AND c.service_area LIKE ?'; params.push(`%${city}%`); }
  sql += ' ORDER BY c.rating DESC LIMIT 50';
  const list = db.prepare(sql).all(...params);
  res.json({ code: 0, data: list });
});

export default router;
