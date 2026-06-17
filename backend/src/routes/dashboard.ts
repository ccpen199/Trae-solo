import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/overview', (_req, res) => {
  const total_orders = (db.prepare('SELECT COUNT(*) c FROM shipment_orders').get() as any).c;
  const total_revenue = (db.prepare('SELECT IFNULL(SUM(total_amount),0) c FROM shipment_orders').get() as any).c;
  const signed_count = (db.prepare("SELECT COUNT(*) c FROM shipment_orders WHERE status = 'signed'").get() as any).c;
  const exception_count = (db.prepare("SELECT COUNT(*) c FROM shipment_orders WHERE status = 'exception' OR is_address_abnormal = 1").get() as any).c;
  const total_brands = (db.prepare("SELECT COUNT(*) c FROM courier_brands WHERE api_status = 'active'").get() as any).c;
  const total_couriers = (db.prepare("SELECT COUNT(*) c FROM couriers WHERE work_status != 'offline'").get() as any).c;
  const total_branches = (db.prepare('SELECT COUNT(*) c FROM branches').get() as any).c;
  const success_rate = total_orders ? +(signed_count / total_orders * 100).toFixed(2) : 0;
  const on_time_rate = signed_count ? +(signed_count / signed_count * 100).toFixed(2) : 0;
  const complaint_count = (db.prepare("SELECT COUNT(*) c FROM complaints WHERE status != 'resolved'").get() as any).c;
  const complaint_rate = total_orders ? +(complaint_count / total_orders * 100).toFixed(3) : 0;

  const today = (db.prepare('SELECT MAX(DATE(created_at)) d FROM shipment_orders').get() as any).d || new Date().toISOString().slice(0, 10);
  const today_orders = (db.prepare("SELECT COUNT(*) c FROM shipment_orders WHERE DATE(created_at) = ?").get(today) as any).c;
  const today_revenue = (db.prepare("SELECT IFNULL(SUM(total_amount),0) c FROM shipment_orders WHERE DATE(created_at) = ?").get(today) as any).c;

  res.json({
    summary: {
      total_orders, total_revenue: +total_revenue.toFixed(2), success_rate, on_time_rate,
      exception_count, complaint_count, complaint_rate,
      total_brands, total_couriers, total_branches,
      today_orders, today_revenue: +today_revenue.toFixed(2)
    }
  });
});

router.get('/brand-quality', (_req, res) => {
  const brands = db.prepare(`
    SELECT b.id, b.code, b.name, b.rating, b.coverage_score,
      (SELECT COUNT(*) FROM shipment_orders o WHERE o.brand_id = b.id) total,
      (SELECT COUNT(*) FROM shipment_orders o WHERE o.brand_id = b.id AND o.status = 'signed') signed,
      (SELECT COUNT(*) FROM shipment_orders o WHERE o.brand_id = b.id AND o.status = 'signed' AND o.actual_delivery_time <= o.estimated_delivery_time) on_time,
      (SELECT COUNT(*) FROM shipment_orders o WHERE o.brand_id = b.id AND (o.status = 'exception' OR o.is_address_abnormal = 1)) exceptions,
      (SELECT COUNT(*) FROM complaints c JOIN shipment_orders o ON c.order_id = o.id WHERE o.brand_id = b.id) complaints
    FROM courier_brands b ORDER BY b.rating DESC LIMIT 15
  `).all() as any[];

  const list = brands.map(b => {
    const total = b.total || 1;
    return {
      ...b,
      success_rate: +((b.signed || 0) / total * 100).toFixed(2),
      on_time_rate: +((b.on_time || 0) / Math.max(1, b.signed) * 100).toFixed(2),
      exception_rate: +((b.exceptions || 0) / total * 100).toFixed(2),
      complaint_rate: +((b.complaints || 0) / total * 100).toFixed(3)
    };
  });
  res.json({ list });
});

router.get('/orders-trend', (_req, res) => {
  const rows = db.prepare(`
    SELECT DATE(created_at) d, COUNT(*) c, IFNULL(SUM(total_amount),0) r
    FROM shipment_orders GROUP BY DATE(created_at) ORDER BY d DESC LIMIT 14
  `).all() as any[];
  rows.reverse();
  res.json({
    dates: rows.map(r => r.d),
    orders: rows.map(r => r.c),
    revenue: rows.map(r => +r.r.toFixed(2))
  });
});

router.get('/network-topology', (_req, res) => {
  const branches = db.prepare(`
    SELECT br.*, b.name brand_name, b.code brand_code, b.rating brand_rating
    FROM branches br LEFT JOIN courier_brands b ON br.brand_id = b.id
    WHERE br.status = 'active' LIMIT 150
  `).all();
  const couriers = db.prepare(`
    SELECT c.id, c.name, c.phone, c.rating, c.work_status, c.longitude, c.latitude, c.service_area,
           b.name brand_name, b.code brand_code
    FROM couriers c LEFT JOIN courier_brands b ON c.brand_id = b.id WHERE c.work_status != 'offline' LIMIT 80
  `).all();
  const brands = db.prepare(`
    SELECT b.id, b.code, b.name, b.rating,
      (SELECT COUNT(*) FROM couriers c WHERE c.brand_id = b.id) courier_count,
      (SELECT COUNT(*) FROM branches br WHERE br.brand_id = b.id) branch_count
    FROM courier_brands b WHERE b.api_status = 'active' ORDER BY b.rating DESC LIMIT 10
  `).all();
  res.json({ branches, couriers, brands });
});

router.get('/api-usage', (_req, res) => {
  const apps = db.prepare('SELECT * FROM api_applications ORDER BY total_calls DESC').all();
  const totalCalls = (db.prepare('SELECT IFNULL(SUM(total_calls),0) c FROM api_applications').get() as any).c;
  const todayCalls = (db.prepare('SELECT IFNULL(SUM(today_calls),0) c FROM api_applications').get() as any).c;
  const logs = db.prepare(`
    SELECT DATE(created_at) d, COUNT(*) c FROM api_call_logs
    GROUP BY DATE(created_at) ORDER BY d DESC LIMIT 14
  `).all().reverse() as any[];
  res.json({
    apps,
    summary: { total_calls: totalCalls, today_calls: todayCalls, app_count: apps.length },
    trend: { dates: logs.map(l => l.d), calls: logs.map(l => l.c) }
  });
});

router.get('/brand-quality/:id', (req, res) => {
  const brand = db.prepare(`
    SELECT b.*,
      (SELECT COUNT(*) FROM shipment_orders o WHERE o.brand_id = b.id) total,
      (SELECT COUNT(*) FROM shipment_orders o WHERE o.brand_id = b.id AND o.status = 'signed') signed,
      (SELECT COUNT(*) FROM shipment_orders o WHERE o.brand_id = b.id AND o.status = 'signed' AND o.actual_delivery_time <= o.estimated_delivery_time) on_time,
      (SELECT COUNT(*) FROM shipment_orders o WHERE o.brand_id = b.id AND (o.status = 'exception' OR o.is_address_abnormal = 1)) exceptions,
      (SELECT COUNT(*) FROM complaints c JOIN shipment_orders o ON c.order_id = o.id WHERE o.brand_id = b.id) complaints
    FROM courier_brands b WHERE b.id = ?
  `).get(req.params.id) as any;
  if (!brand) return res.status(404).json({ code: 'NOT_FOUND', message: '品牌不存在' });

  const total = brand.total || 1;
  const trend = db.prepare(`
    SELECT DATE(created_at) d, COUNT(*) c,
      SUM(CASE WHEN status = 'signed' THEN 1 ELSE 0 END) s,
      SUM(CASE WHEN status = 'signed' AND actual_delivery_time <= estimated_delivery_time THEN 1 ELSE 0 END) ot,
      SUM(CASE WHEN status = 'exception' OR is_address_abnormal = 1 THEN 1 ELSE 0 END) ex
    FROM shipment_orders WHERE brand_id = ? GROUP BY DATE(created_at) ORDER BY d DESC LIMIT 14
  `).all(req.params.id).reverse() as any[];

  const recentOrders = db.prepare(`
    SELECT o.id, o.order_no, o.tracking_no, o.status, o.created_at, o.estimated_delivery_time, o.actual_delivery_time,
      o.receiver_name, o.receiver_address, o.is_address_abnormal, o.face_verified
    FROM shipment_orders o WHERE o.brand_id = ? ORDER BY o.created_at DESC LIMIT 20
  `).all(req.params.id);

  const recentComplaints = db.prepare(`
    SELECT c.id, c.type, c.status, c.description, c.sla_deadline, c.created_at,
      o.order_no, o.tracking_no
    FROM complaints c JOIN shipment_orders o ON c.order_id = o.id
    WHERE o.brand_id = ? ORDER BY c.created_at DESC LIMIT 10
  `).all(req.params.id);

  res.json({
    ...brand,
    success_rate: +((brand.signed || 0) / total * 100).toFixed(2),
    on_time_rate: +((brand.on_time || 0) / Math.max(1, brand.signed) * 100).toFixed(2),
    exception_rate: +((brand.exceptions || 0) / total * 100).toFixed(2),
    complaint_rate: +((brand.complaints || 0) / total * 100).toFixed(3),
    trend: {
      dates: trend.map(t => t.d),
      orders: trend.map(t => t.c),
      signed: trend.map(t => t.s),
      on_time: trend.map(t => t.ot),
      exceptions: trend.map(t => t.ex)
    },
    recent_orders: recentOrders,
    recent_complaints: recentComplaints
  });
});

router.get('/audit-logs', (req, res) => {
  const { page = 1, pageSize = 30, app_id, api_path, method, status, date_from, date_to } = req.query as any;
  const offset = (page - 1) * pageSize;
  let where = [];
  let params: any[] = [];
  if (app_id) { where.push('l.app_id = ?'); params.push(app_id); }
  if (api_path) { where.push('l.api_path LIKE ?'); params.push(`%${api_path}%`); }
  if (method) { where.push('l.method = ?'); params.push(method); }
  if (status) {
    if (status === 'success') { where.push('l.response_status BETWEEN 200 AND 299'); }
    else if (status === 'error') { where.push('l.response_status >= 400'); }
    else { where.push('l.response_status = ?'); params.push(+status); }
  }
  if (date_from) { where.push('DATE(l.created_at) >= ?'); params.push(date_from); }
  if (date_to) { where.push('DATE(l.created_at) <= ?'); params.push(date_to); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = (db.prepare(`SELECT COUNT(*) c FROM api_call_logs l ${whereSql}`).get(...params) as any).c;
  const rawList = db.prepare(`
    SELECT l.*, a.app_name, a.app_key FROM api_call_logs l
    LEFT JOIN api_applications a ON l.app_id = a.id
    ${whereSql} ORDER BY l.id DESC LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);
  const list = (rawList as any[]).map(item => ({
    ...item,
    path: item.api_path,
    status: item.response_status,
    latency_ms: item.response_time
  }));

  const stats = db.prepare(`
    SELECT
      COUNT(*) total_calls,
      SUM(CASE WHEN response_status BETWEEN 200 AND 299 THEN 1 ELSE 0 END) success_calls,
      SUM(CASE WHEN response_status >= 400 THEN 1 ELSE 0 END) error_calls,
      AVG(response_time) avg_response_time
    FROM api_call_logs l ${whereSql}
  `).get(...params) as any;

  res.json({
    list, total, page: +page, pageSize: +pageSize,
    stats: {
      total_calls: stats.total_calls || 0,
      success_calls: stats.success_calls || 0,
      error_calls: stats.error_calls || 0,
      success_rate: stats.total_calls ? +((stats.success_calls || 0) / stats.total_calls * 100).toFixed(2) : 0,
      avg_response_time: Math.round(stats.avg_response_time || 0)
    }
  });
});

router.get('/realtime-map', (_req, res) => {
  const orders = db.prepare(`
    SELECT o.id, o.order_no, o.tracking_no, o.status, o.sender_address, o.receiver_address,
           o.sender_longitude, o.sender_latitude, o.receiver_longitude, o.receiver_latitude,
           o.estimated_delivery_time, o.is_address_abnormal,
           b.name brand_name, b.code brand_code,
           c.name courier_name, c.longitude courier_lng, c.latitude courier_lat
    FROM shipment_orders o LEFT JOIN courier_brands b ON o.brand_id = b.id LEFT JOIN couriers c ON o.courier_id = c.id
    WHERE o.status IN ('out_for_delivery','in_transit','arrived_branch') LIMIT 50
  `).all();

  const abnormalAddresses = db.prepare(`
    SELECT o.id, o.tracking_no, o.receiver_address, o.status, o.created_at,
           o.is_address_abnormal, o.receiver_longitude, o.receiver_latitude,
           o.sender_address, b.name brand_name, c.name courier_name
    FROM shipment_orders o
    LEFT JOIN courier_brands b ON o.brand_id = b.id
    LEFT JOIN couriers c ON o.courier_id = c.id
    WHERE o.is_address_abnormal = 1 LIMIT 20
  `).all() as any[];

  let reviewEventsMap: Record<number, any> = {};
  if (abnormalAddresses.length > 0) {
    const orderIds = abnormalAddresses.map(a => a.id);
    const placeholders = orderIds.map(() => '?').join(',');
    const reviewEvents = db.prepare(`
      SELECT te.* FROM tracking_events te
      INNER JOIN (
        SELECT order_id, MAX(created_at) max_created
        FROM tracking_events
        WHERE event_type IN ('ADDRESS_REVIEWED', 'ADDRESS_UPDATED')
          AND order_id IN (${placeholders})
        GROUP BY order_id
      ) latest ON te.order_id = latest.order_id AND te.created_at = latest.max_created
      WHERE te.event_type IN ('ADDRESS_REVIEWED', 'ADDRESS_UPDATED')
    `).all(...orderIds) as any[];
    reviewEvents.forEach(e => { reviewEventsMap[e.order_id] = e; });
  }

  const abnormalAddressesWithReview = abnormalAddresses.map(addr => {
    const evt = reviewEventsMap[addr.id];
    let review_status = 'pending';
    if (evt) {
      if (evt.event_type === 'ADDRESS_UPDATED') {
        review_status = 'corrected';
      } else if (evt.event_type === 'ADDRESS_REVIEWED' && addr.is_address_abnormal === 0) {
        review_status = 'reviewed_normal';
      }
    }
    let abnormal_type = '地址异常';
    if (addr.receiver_address) {
      if (addr.receiver_address.includes('虚构')) abnormal_type = '虚构地址';
      else if (addr.receiver_address.includes('假小区')) abnormal_type = '假小区';
      else if (addr.receiver_address.includes('不存在街')) abnormal_type = '不存在街道';
    }
    return {
      id: addr.id,
      tracking_no: addr.tracking_no,
      receiver_address: addr.receiver_address,
      status: addr.status,
      created_at: addr.created_at,
      review_status,
      reviewed_by: evt ? evt.operator_name : null,
      reviewed_at: evt ? evt.created_at : null,
      review_note: evt ? evt.event_desc : null,
      abnormal_type,
      receiver_longitude: addr.receiver_longitude,
      receiver_latitude: addr.receiver_latitude,
      sender_address: addr.sender_address,
      brand_name: addr.brand_name,
      courier_name: addr.courier_name
    };
  });

  res.json({ orders, abnormal_addresses: abnormalAddressesWithReview });
});

export default router;
