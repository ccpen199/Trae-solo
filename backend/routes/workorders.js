import { Router } from 'express';
import db from '../db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const SERVICE_AREAS = [
  { city: '北京市', districts: ['朝阳区', '海淀区', '东城区', '西城区', '丰台区', '通州区'] },
  { city: '上海市', districts: ['浦东新区', '黄浦区', '徐汇区', '静安区', '长宁区'] },
];

const PRIORITY_SLA_HOURS = { low: 72, normal: 48, high: 24, urgent: 8 };

function generateOrderNo() {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const last = db.prepare("SELECT order_no FROM work_orders WHERE order_no LIKE ? ORDER BY order_no DESC LIMIT 1").get(`WO${dateStr}%`);
  let seq = 1;
  if (last) {
    seq = parseInt(last.order_no.slice(-4)) + 1;
  }
  return `WO${dateStr}${String(seq).padStart(4, '0')}`;
}

function checkServiceArea(city, district) {
  const area = SERVICE_AREAS.find(a => a.city === city);
  if (!area) return false;
  return area.districts.includes(district);
}

router.get('/', (req, res) => {
  const { status, user_id, engineer_id, priority } = req.query;
  let sql = `
    SELECT wo.*, a.province, a.city, a.district, a.street, a.detail, a.contact_name, a.contact_phone
    FROM work_orders wo
    LEFT JOIN addresses a ON wo.address_id = a.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND wo.status = ?';
    params.push(status);
  }
  if (user_id) {
    sql += ' AND wo.user_id = ?';
    params.push(user_id);
  }
  if (priority) {
    sql += ' AND wo.priority = ?';
    params.push(priority);
  }
  if (engineer_id) {
    sql += ' AND wo.id IN (SELECT order_id FROM dispatch_records WHERE engineer_id = ? AND status = ?)';
    params.push(engineer_id, 'accepted');
  }

  sql += ' ORDER BY wo.created_at DESC';
  const orders = db.prepare(sql).all(...params);

  for (const order of orders) {
    order.photos = JSON.parse(order.photos || '[]');
    const dispatch = db.prepare(`
      SELECT dr.*, u.name as engineer_name, u.phone as engineer_phone
      FROM dispatch_records dr
      LEFT JOIN users u ON dr.engineer_id = u.id
      WHERE dr.order_id = ? AND dr.status = 'accepted'
      ORDER BY dr.dispatched_at DESC LIMIT 1
    `).get(order.id);
    order.dispatch = dispatch || null;
  }

  res.json(orders);
});

router.post('/', (req, res) => {
  const { address_id, fault_description, photos, expected_time, warranty_type, warranty_proof, service_type, priority } = req.body;
  if (!fault_description) {
    return res.status(400).json({ error: '故障描述不能为空' });
  }

  const address = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(address_id, req.user.id);
  if (!address) {
    return res.status(400).json({ error: '地址不存在' });
  }

  const inServiceArea = checkServiceArea(address.city, address.district) ? 1 : 0;
  const orderNo = generateOrderNo();
  const slaHours = PRIORITY_SLA_HOURS[priority || 'normal'];
  const slaDeadline = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();

  try {
    const result = db.prepare(`
      INSERT INTO work_orders (order_no, user_id, address_id, fault_description, photos, expected_time,
        warranty_type, warranty_proof, service_type, priority, sla_deadline, in_service_area)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderNo, req.user.id, address_id, fault_description,
      JSON.stringify(photos || []),
      expected_time || null,
      warranty_type || 'none',
      warranty_proof || null,
      service_type || null,
      priority || 'normal',
      slaDeadline,
      inServiceArea
    );

    const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(result.lastInsertRowid);
    order.photos = JSON.parse(order.photos || '[]');
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: '创建工单失败' });
  }
});

router.get('/:id', (req, res) => {
  const order = db.prepare(`
    SELECT wo.*, a.province, a.city, a.district, a.street, a.detail, a.contact_name, a.contact_phone
    FROM work_orders wo
    LEFT JOIN addresses a ON wo.address_id = a.id
    WHERE wo.id = ?
  `).get(req.params.id);

  if (!order) {
    return res.status(404).json({ error: '工单不存在' });
  }

  order.photos = JSON.parse(order.photos || '[]');

  order.dispatches = db.prepare(`
    SELECT dr.*, u.name as engineer_name, u.phone as engineer_phone
    FROM dispatch_records dr
    LEFT JOIN users u ON dr.engineer_id = u.id
    WHERE dr.order_id = ?
    ORDER BY dr.dispatched_at DESC
  `).all(order.id);

  order.serviceRecord = db.prepare('SELECT * FROM service_records WHERE order_id = ?').get(order.id) || null;
  if (order.serviceRecord) {
    order.serviceRecord.repair_photos = JSON.parse(order.serviceRecord.repair_photos || '[]');
    order.serviceRecord.parts = db.prepare('SELECT * FROM parts_usage WHERE service_record_id = ?').all(order.serviceRecord.id);
  }

  order.quote = db.prepare('SELECT * FROM cost_quotes WHERE order_id = ?').get(order.id) || null;
  order.exceptions = db.prepare('SELECT * FROM exceptions WHERE order_id = ?').all(order.id);

  res.json(order);
});

router.put('/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '工单不存在' });
  }

  const { fault_description, photos, expected_time, warranty_type, warranty_proof, service_type, priority } = req.body;

  try {
    db.prepare(`
      UPDATE work_orders SET fault_description = ?, photos = ?, expected_time = ?,
        warranty_type = ?, warranty_proof = ?, service_type = ?, priority = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      fault_description || order.fault_description,
      JSON.stringify(photos || JSON.parse(order.photos || '[]')),
      expected_time !== undefined ? expected_time : order.expected_time,
      warranty_type || order.warranty_type,
      warranty_proof !== undefined ? warranty_proof : order.warranty_proof,
      service_type || order.service_type,
      priority || order.priority,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.id);
    updated.photos = JSON.parse(updated.photos || '[]');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '更新工单失败' });
  }
});

router.patch('/:id/status', (req, res) => {
  const validStatuses = ['pending','dispatched','accepted','departed','arrived','repairing','quoting','confirmed','completed','cancelled','exception'];
  const { status } = req.body;
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: '无效的状态值' });
  }

  const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '工单不存在' });
  }

  db.prepare("UPDATE work_orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);

  const updated = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.id);
  updated.photos = JSON.parse(updated.photos || '[]');
  res.json(updated);
});

export default router;
