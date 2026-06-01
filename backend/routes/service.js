import { Router } from 'express';
import db from '../db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/my-orders', roleMiddleware(['engineer']), (req, res) => {
  const orders = db.prepare(`
    SELECT wo.*, a.province, a.city, a.district, a.street, a.detail, a.contact_name, a.contact_phone
    FROM work_orders wo
    LEFT JOIN addresses a ON wo.address_id = a.id
    WHERE wo.id IN (
      SELECT order_id FROM dispatch_records WHERE engineer_id = ? AND status = 'accepted'
    )
    ORDER BY
      CASE wo.status
        WHEN 'repairing' THEN 1
        WHEN 'arrived' THEN 2
        WHEN 'departed' THEN 3
        WHEN 'accepted' THEN 4
        WHEN 'quoting' THEN 5
        WHEN 'confirmed' THEN 6
        WHEN 'completed' THEN 7
        ELSE 8
      END,
      wo.created_at ASC
  `).all(req.user.id);

  for (const order of orders) {
    order.photos = JSON.parse(order.photos || '[]');
    order.serviceRecord = db.prepare('SELECT * FROM service_records WHERE order_id = ? AND engineer_id = ?').get(order.id, req.user.id) || null;
    if (order.serviceRecord) {
      order.serviceRecord.repair_photos = JSON.parse(order.serviceRecord.repair_photos || '[]');
    }
  }

  res.json(orders);
});

router.patch('/:orderId/accept', roleMiddleware(['engineer']), (req, res) => {
  const dispatch = db.prepare('SELECT * FROM dispatch_records WHERE order_id = ? AND engineer_id = ? AND status = ?').get(req.params.orderId, req.user.id, 'accepted');
  if (!dispatch) {
    return res.status(404).json({ error: '未找到已接受的派工记录' });
  }

  const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.orderId);
  if (!order || order.status !== 'dispatched') {
    return res.status(400).json({ error: '工单状态不正确' });
  }

  const transaction = db.transaction(() => {
    db.prepare("UPDATE work_orders SET status = 'accepted', updated_at = datetime('now') WHERE id = ?").run(req.params.orderId);

    const existing = db.prepare('SELECT * FROM service_records WHERE order_id = ? AND engineer_id = ?').get(req.params.orderId, req.user.id);
    if (existing) {
      db.prepare("UPDATE service_records SET accepted_at = datetime('now'), status = 'accepted' WHERE id = ?").run(existing.id);
    } else {
      db.prepare(`
        INSERT INTO service_records (order_id, engineer_id, accepted_at, status)
        VALUES (?, ?, datetime('now'), 'accepted')
      `).run(req.params.orderId, req.user.id);
    }
  });

  try {
    transaction();
    const updated = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.orderId);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '接单失败' });
  }
});

router.patch('/:orderId/depart', roleMiddleware(['engineer']), (req, res) => {
  const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.orderId);
  if (!order) return res.status(404).json({ error: '工单不存在' });
  if (order.status !== 'accepted') return res.status(400).json({ error: '工单状态不允许出发' });

  const transaction = db.transaction(() => {
    db.prepare("UPDATE work_orders SET status = 'departed', updated_at = datetime('now') WHERE id = ?").run(req.params.orderId);
    db.prepare("UPDATE service_records SET departed_at = datetime('now'), status = 'departed' WHERE order_id = ? AND engineer_id = ?").run(req.params.orderId, req.user.id);
  });

  try {
    transaction();
    const updated = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.orderId);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '出发操作失败' });
  }
});

router.patch('/:orderId/arrive', roleMiddleware(['engineer']), (req, res) => {
  const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.orderId);
  if (!order) return res.status(404).json({ error: '工单不存在' });
  if (order.status !== 'departed') return res.status(400).json({ error: '工单状态不允许到达' });

  const transaction = db.transaction(() => {
    db.prepare("UPDATE work_orders SET status = 'arrived', updated_at = datetime('now') WHERE id = ?").run(req.params.orderId);
    db.prepare("UPDATE service_records SET arrived_at = datetime('now'), status = 'arrived' WHERE order_id = ? AND engineer_id = ?").run(req.params.orderId, req.user.id);
  });

  try {
    transaction();
    const updated = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.orderId);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '到达操作失败' });
  }
});

router.patch('/:orderId/repair', roleMiddleware(['engineer']), (req, res) => {
  const { repair_description, repair_photos } = req.body;
  if (!repair_description) return res.status(400).json({ error: '维修描述不能为空' });

  const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.orderId);
  if (!order) return res.status(404).json({ error: '工单不存在' });
  if (!['arrived', 'repairing'].includes(order.status)) return res.status(400).json({ error: '工单状态不允许维修' });

  const transaction = db.transaction(() => {
    db.prepare("UPDATE work_orders SET status = 'repairing', updated_at = datetime('now') WHERE id = ?").run(req.params.orderId);
    db.prepare(`
      UPDATE service_records SET repair_description = ?, repair_photos = ?, status = 'repairing'
      WHERE order_id = ? AND engineer_id = ?
    `).run(repair_description, JSON.stringify(repair_photos || []), req.params.orderId, req.user.id);
  });

  try {
    transaction();
    const updated = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.orderId);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '维修记录提交失败' });
  }
});

router.post('/:orderId/parts', roleMiddleware(['engineer']), (req, res) => {
  const { part_name, part_code, quantity, unit_price } = req.body;
  if (!part_name || !part_code) return res.status(400).json({ error: '配件名称和编码不能为空' });

  const serviceRecord = db.prepare('SELECT * FROM service_records WHERE order_id = ? AND engineer_id = ?').get(req.params.orderId, req.user.id);
  if (!serviceRecord) return res.status(404).json({ error: '服务记录不存在' });

  const qty = quantity || 1;
  const price = unit_price || 0;
  const totalPrice = qty * price;

  try {
    const result = db.prepare(`
      INSERT INTO parts_usage (service_record_id, part_name, part_code, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(serviceRecord.id, part_name, part_code, qty, price, totalPrice);

    const part = db.prepare('SELECT * FROM parts_usage WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(part);
  } catch (err) {
    res.status(500).json({ error: '添加配件失败' });
  }
});

router.post('/:orderId/quote', roleMiddleware(['engineer']), (req, res) => {
  const { labor_cost, parts_cost, travel_cost, other_cost, cost_description } = req.body;

  const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.orderId);
  if (!order) return res.status(404).json({ error: '工单不存在' });
  if (!['repairing', 'arrived'].includes(order.status)) return res.status(400).json({ error: '工单状态不允许报价' });

  const serviceRecord = db.prepare('SELECT * FROM service_records WHERE order_id = ? AND engineer_id = ?').get(req.params.orderId, req.user.id);
  if (!serviceRecord) return res.status(404).json({ error: '服务记录不存在' });

  const labor = labor_cost || 0;
  const parts = parts_cost || 0;
  const travel = travel_cost || 0;
  const other = other_cost || 0;
  const total = labor + parts + travel + other;

  const transaction = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO cost_quotes (order_id, service_record_id, labor_cost, parts_cost, travel_cost, other_cost, total_cost, cost_description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.params.orderId, serviceRecord.id, labor, parts, travel, other, total, cost_description || null);

    db.prepare("UPDATE work_orders SET status = 'quoting', updated_at = datetime('now') WHERE id = ?").run(req.params.orderId);
    return result;
  });

  try {
    const result = transaction();
    const quote = db.prepare('SELECT * FROM cost_quotes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(quote);
  } catch (err) {
    res.status(500).json({ error: '报价提交失败' });
  }
});

router.post('/:orderId/sign', (req, res) => {
  const { signature } = req.body;
  if (!signature) return res.status(400).json({ error: '签名不能为空' });

  const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.orderId);
  if (!order) return res.status(404).json({ error: '工单不存在' });
  if (order.status !== 'quoting' && order.status !== 'confirmed') return res.status(400).json({ error: '工单状态不允许签名确认' });

  const quote = db.prepare('SELECT * FROM cost_quotes WHERE order_id = ? AND status = ?').get(req.params.orderId, 'pending');
  const serviceRecord = db.prepare('SELECT * FROM service_records WHERE order_id = ?').get(req.params.orderId);
  if (!serviceRecord) return res.status(404).json({ error: '服务记录不存在' });

  const transaction = db.transaction(() => {
    if (quote) {
      db.prepare("UPDATE cost_quotes SET status = 'confirmed', confirmed_by = ?, confirmed_at = datetime('now') WHERE id = ?").run(req.user.id, quote.id);
    }

    db.prepare(`
      UPDATE service_records SET user_signature = ?, completion_at = datetime('now'), status = 'completed'
      WHERE id = ?
    `).run(signature, serviceRecord.id);

    db.prepare("UPDATE work_orders SET status = 'completed', updated_at = datetime('now') WHERE id = ?").run(req.params.orderId);
  });

  try {
    transaction();
    const updated = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.orderId);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '签名确认失败' });
  }
});

export default router;
