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
  const on_time_count = (db.prepare("SELECT COUNT(*) c FROM shipment_orders WHERE status = 'signed' AND actual_delivery_time <= estimated_delivery_time").get() as any).c;
  const success_rate = total_orders ? +(signed_count / total_orders * 100).toFixed(2) : 0;
  const on_time_rate = signed_count ? +(on_time_count / signed_count * 100).toFixed(2) : 0;
  const complaint_count = (db.prepare("SELECT COUNT(*) c FROM complaints WHERE status != 'resolved'").get() as any).c;
  const complaint_rate = total_orders ? +(complaint_count / total_orders * 100).toFixed(3) : 0;

  const today = new Date().toISOString().slice(0, 10);
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
    SELECT id, tracking_no, receiver_address, status, created_at
    FROM shipment_orders WHERE is_address_abnormal = 1 LIMIT 20
  `).all();
  res.json({ orders, abnormal_addresses: abnormalAddresses });
});

export default router;
