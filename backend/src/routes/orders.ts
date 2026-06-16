import { Router } from 'express';
import db from '../db';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';

const router = Router();

function formatDate(d: Date) { return d.toISOString().slice(0, 19).replace('T', ' '); }

router.get('/', (req: AuthRequest, res) => {
  const { page = 1, pageSize = 20, keyword, status, brand_id, date_from, date_to, my } = req.query as any;
  const offset = (page - 1) * pageSize;
  let where = [];
  let params: any[] = [];
  if (req.user.role === 'user') { where.push('(o.sender_id = ? OR o.receiver_id = ?)'); params.push(req.user.id, req.user.id); }
  if (my === '1' && req.user.role === 'courier') {
    const c = db.prepare('SELECT id FROM couriers WHERE user_id = ?').get(req.user.id) as any;
    if (c) { where.push('o.courier_id = ?'); params.push(c.id); }
  }
  if (keyword) { where.push('(o.order_no LIKE ? OR o.tracking_no LIKE ? OR o.receiver_name LIKE ? OR o.sender_name LIKE ? OR o.receiver_phone LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
  if (status) { where.push('o.status = ?'); params.push(status); }
  if (brand_id) { where.push('o.brand_id = ?'); params.push(brand_id); }
  if (date_from) { where.push('DATE(o.created_at) >= ?'); params.push(date_from); }
  if (date_to) { where.push('DATE(o.created_at) <= ?'); params.push(date_to); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = (db.prepare(`SELECT COUNT(*) c FROM shipment_orders o ${whereSql}`).get(...params) as any).c;
  const list = db.prepare(`SELECT o.*, b.name brand_name, b.code brand_code, c.name courier_name, c.phone courier_phone FROM shipment_orders o LEFT JOIN courier_brands b ON o.brand_id = b.id LEFT JOIN couriers c ON o.courier_id = c.id ${whereSql} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset);
  res.json({ list, total, page: +page, pageSize: +pageSize });
});

router.get('/stats/summary', (req: AuthRequest, res) => {
  const userId = req.user.id;
  const baseWhere = req.user.role === 'user' ? 'WHERE sender_id = ? OR receiver_id = ?' : '';
  const params = req.user.role === 'user' ? [userId, userId] : [];
  const total = (db.prepare(`SELECT COUNT(*) c FROM shipment_orders ${baseWhere}`).get(...params) as any).c;
  const inTransit = (db.prepare(`SELECT COUNT(*) c FROM shipment_orders ${baseWhere ? baseWhere + ' AND' : 'WHERE'} status IN ('created','picked','in_transit','arrived_branch')`).get(...params) as any).c;
  const delivering = (db.prepare(`SELECT COUNT(*) c FROM shipment_orders ${baseWhere ? baseWhere + ' AND' : 'WHERE'} status = 'out_for_delivery'`).get(...params) as any).c;
  const signed = (db.prepare(`SELECT COUNT(*) c FROM shipment_orders ${baseWhere ? baseWhere + ' AND' : 'WHERE'} status = 'signed'`).get(...params) as any).c;
  const exception = (db.prepare(`SELECT COUNT(*) c FROM shipment_orders ${baseWhere ? baseWhere + ' AND' : 'WHERE'} status = 'exception' OR is_address_abnormal = 1`).get(...params) as any).c;
  res.json({ total, in_transit: inTransit, delivering, signed, exception });
});

router.get('/:id', (req, res) => {
  const order = db.prepare(`SELECT o.*, b.name brand_name, b.code brand_code, b.rating brand_rating, c.name courier_name, c.phone courier_phone, c.rating courier_rating, c.longitude courier_lng, c.latitude courier_lat, c.voice_greeting FROM shipment_orders o LEFT JOIN courier_brands b ON o.brand_id = b.id LEFT JOIN couriers c ON o.courier_id = c.id WHERE o.id = ?`).get(req.params.id) as any;
  if (!order) return res.status(404).json({ code: 'NOT_FOUND', message: '订单不存在' });
  const events = db.prepare('SELECT * FROM tracking_events WHERE order_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json({ ...order, events });
});

router.get('/tracking/:trackingNo', (req, res) => {
  const order = db.prepare(`SELECT o.*, b.name brand_name, b.code brand_code, c.name courier_name, c.phone courier_phone, c.rating courier_rating, c.longitude courier_lng, c.latitude courier_lat, c.voice_greeting FROM shipment_orders o LEFT JOIN courier_brands b ON o.brand_id = b.id LEFT JOIN couriers c ON o.courier_id = c.id WHERE o.tracking_no = ?`).get(req.params.trackingNo) as any;
  if (!order) return res.status(404).json({ code: 'NOT_FOUND', message: '运单号不存在' });
  const events = db.prepare('SELECT * FROM tracking_events WHERE tracking_no = ? ORDER BY created_at DESC').all(req.params.trackingNo);
  res.json({ ...order, events });
});

router.post('/', (req: AuthRequest, res) => {
  const data = req.body;
  const brand = db.prepare('SELECT * FROM courier_brands WHERE id = ? AND api_status = ?').get(data.brand_id, 'active') as any;
  if (!brand) return res.status(400).json({ code: 'BAD_BRAND', message: '无效的快递品牌' });
  const couriers = db.prepare('SELECT * FROM couriers WHERE brand_id = ? AND work_status = ? ORDER BY rating DESC LIMIT 5').all(data.brand_id, 'online') as any[];
  if (!couriers.length) return res.status(400).json({ code: 'NO_COURIER', message: '该品牌暂无可接单快递员' });
  const courier = couriers[Math.floor(Math.random() * couriers.length)];
  const now = new Date();
  const orderNo = `EXP${formatDate(now).replace(/[-: ]/g, '')}${uuidv4().slice(0, 8).toUpperCase()}`;
  const trackingNo = `${brand.code}${orderNo.slice(3)}`;
  const weight = +(data.weight || 1).toFixed(2);
  const price = +(brand.base_price + brand.per_kg_price * Math.max(0, weight - 1)).toFixed(2);
  const insurance = +(data.declared_value ? data.declared_value * 0.01 : 0).toFixed(2);
  const est = new Date(now.getTime() + (brand.avg_delivery_hours + 6) * 3600000);

  const isAbnormal = /(虚构|假.*小区|不存在.*街)/.test(data.receiver_address || '') ? 1 : 0;

  const info = db.prepare(`INSERT INTO shipment_orders (order_no, tracking_no, brand_id, courier_id, sender_id, receiver_id, sender_name, sender_phone, sender_address, sender_longitude, sender_latitude, receiver_name, receiver_phone, receiver_address, receiver_longitude, receiver_latitude, weight, length, width, height, goods_name, goods_type, declared_value, price, insurance_fee, total_amount, priority, payment_method, is_cod, cod_amount, estimated_delivery_time, is_address_abnormal, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    orderNo, trackingNo, brand.id, courier.id,
    req.user.id, null,
    data.sender_name, data.sender_phone, data.sender_address,
    data.sender_longitude || 116.4, data.sender_latitude || 39.9,
    data.receiver_name, data.receiver_phone, data.receiver_address,
    isAbnormal ? 0 : (data.receiver_longitude || 121.47), isAbnormal ? 0 : (data.receiver_latitude || 31.23),
    weight, data.length || 30, data.width || 20, data.height || 10,
    data.goods_name || '标准快递', data.goods_type || 'standard',
    data.declared_value || 0, price, insurance, +(price + insurance).toFixed(2),
    data.priority || 'normal', data.payment_method || 'online',
    data.is_cod ? 1 : 0, data.cod_amount || 0,
    formatDate(est), isAbnormal, isAbnormal ? 'exception' : 'created'
  );

  db.prepare(`INSERT INTO tracking_events (order_id, tracking_no, event_type, event_desc, location, longitude, latitude, operator_id, operator_name, is_exception, exception_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    info.lastInsertRowid, trackingNo, 'ORDER_CREATED',
    isAbnormal ? '订单已创建，检测到收货地址异常，请核实' : '订单已创建，等待快递员揽收',
    '系统', data.sender_longitude || 116.4, data.sender_latitude || 39.9,
    req.user.id, req.user.name, isAbnormal ? 1 : 0, isAbnormal ? '地址异常' : null,
    formatDate(now)
  );

  if (isAbnormal) {
    db.prepare("INSERT INTO notifications (user_id, type, title, content, related_id, created_at) VALUES (?, 'exception', '收货地址异常提醒', '您的订单收货地址无法解析，请尽快修改以免影响配送', ?, ?)")
      .run(req.user.id, info.lastInsertRowid, formatDate(now));
  }

  res.json({ message: '创建成功', order_id: info.lastInsertRowid, order_no: orderNo, tracking_no: trackingNo, price, insurance_fee: insurance, total_amount: price + insurance, estimated_delivery_time: formatDate(est) });
});

router.patch('/:id/status', (req, res) => {
  const { status, sign_type, sign_image, face_verified, appointment_time } = req.body;
  const order = db.prepare('SELECT * FROM shipment_orders WHERE id = ?').get(req.params.id) as any;
  if (!order) return res.status(404).json({ code: 'NOT_FOUND', message: '订单不存在' });

  const updates: string[] = [];
  const params: any[] = [];
  if (status) { updates.push('status = ?'); params.push(status); }
  if (sign_type) { updates.push('sign_type = ?'); params.push(sign_type); }
  if (sign_image) { updates.push('sign_image = ?'); params.push(sign_image); }
  if (face_verified !== undefined) { updates.push('face_verified = ?'); params.push(face_verified ? 1 : 0); }
  if (appointment_time) { updates.push('appointment_time = ?'); params.push(appointment_time); }
  updates.push("updated_at = ?"); params.push(formatDate(new Date()));
  if (status === 'signed') { updates.push('actual_delivery_time = ?'); params.push(formatDate(new Date())); }
  params.push(req.params.id);
  db.prepare(`UPDATE shipment_orders SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  if (status) {
    const eventMap: Record<string, [string, string]> = {
      picked: ['PICKED_UP', '快递员已揽收'],
      in_transit: ['IN_TRANSIT', '包裹运输中'],
      arrived_branch: ['ARRIVED_BRANCH', '包裹已到达网点'],
      out_for_delivery: ['OUT_FOR_DELIVERY', '快递员正在派送'],
      signed: ['SIGNED', sign_type === 'face' ? '人脸识别签收成功' : (sign_type === 'electronic' ? '电子签收成功' : '本人已签收')],
      exception: ['EXCEPTION', '包裹异常'],
      returned: ['RETURN_REQUEST', '已申请退回']
    };
    if (eventMap[status]) {
      db.prepare(`INSERT INTO tracking_events (order_id, tracking_no, event_type, event_desc, operator_name, created_at) VALUES (?, ?, ?, ?, ?, ?)`).run(
        req.params.id, order.tracking_no, eventMap[status][0], eventMap[status][1],
        status === 'signed' ? '用户' : '系统', formatDate(new Date())
      );
    }
    if (order.sender_id && ['out_for_delivery', 'signed', 'exception'].includes(status)) {
      db.prepare("INSERT INTO notifications (user_id, type, title, content, related_id, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .run(order.sender_id,
          status === 'out_for_delivery' ? 'delivery' : status === 'signed' ? 'signed' : 'exception',
          status === 'out_for_delivery' ? '包裹正在派送' : status === 'signed' ? '包裹已签收' : '包裹异常',
          `运单 ${order.tracking_no} ${status === 'out_for_delivery' ? '快递员正在派送' : status === 'signed' ? '已成功签收' : '出现异常，请联系客服'}`,
          req.params.id, formatDate(new Date()));
    }
  }
  res.json({ message: '更新成功' });
});

router.post('/:id/appointment', (req, res) => {
  const { appointment_time } = req.body;
  if (!appointment_time) return res.status(400).json({ code: 'BAD_REQUEST', message: '请选择预约时间' });
  db.prepare('UPDATE shipment_orders SET appointment_time = ?, updated_at = ? WHERE id = ?').run(appointment_time, formatDate(new Date()), req.params.id);
  res.json({ message: '预约时间已确认' });
});

router.post('/:id/verify-face', (req: AuthRequest, res) => {
  const { face_data } = req.body;
  const user = db.prepare('SELECT face_data FROM users WHERE id = ?').get(req.user.id) as any;
  const order = db.prepare('SELECT receiver_id, receiver_name FROM shipment_orders WHERE id = ?').get(req.params.id) as any;
  if (!user.face_data) return res.json({ verified: false, message: '您还未录入人脸信息，请先录入' });
  if (!face_data) return res.status(400).json({ code: 'NO_FACE_DATA', message: '请采集人脸' });
  const verified = face_data.length > 10 && face_data.slice(-5) === user.face_data.slice(-5);
  if (verified) {
    db.prepare('UPDATE shipment_orders SET face_verified = 1, updated_at = ? WHERE id = ?').run(formatDate(new Date()), req.params.id);
  }
  res.json({ verified, message: verified ? '人脸识别通过，可以签收' : '人脸不匹配，请再次确认' });
});

router.post('/sync-ecommerce', (req: AuthRequest, res) => {
  const { platform, orders } = req.body;
  if (!orders || !orders.length) return res.status(400).json({ code: 'BAD_REQUEST', message: '订单数据为空' });
  const results: any[] = [];
  for (const o of orders) {
    try {
      const mockBrandId = Math.floor(Math.random() * 10) + 1;
      results.push({ external_id: o.id || o.order_id, platform, synced: true, brand_suggested: mockBrandId });
    } catch (e: any) {
      results.push({ external_id: o.id, synced: false, error: e.message });
    }
  }
  res.json({ total: orders.length, success_count: results.filter(r => r.synced).length, results });
});

export default router;
