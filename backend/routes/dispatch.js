import { Router } from 'express';
import db from '../db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/recommendations/:orderId', roleMiddleware(['dispatcher', 'service_agent']), (req, res) => {
  const order = db.prepare(`
    SELECT wo.*, a.city, a.district
    FROM work_orders wo
    LEFT JOIN addresses a ON wo.address_id = a.id
    WHERE wo.id = ?
  `).get(req.params.orderId);

  if (!order) {
    return res.status(404).json({ error: '工单不存在' });
  }

  const engineers = db.prepare("SELECT * FROM users WHERE role = 'engineer' AND status = 'active'").all();

  const recommendations = engineers.map(eng => {
    const skills = JSON.parse(eng.skills || '[]');
    let score = 50;
    const reasons = [];

    if (order.service_type && skills.includes(order.service_type)) {
      score += 30;
      reasons.push(`技能匹配: ${order.service_type}`);
    }

    if (order.city && eng.area) {
      if (eng.area.includes(order.city)) {
        score += 15;
        reasons.push(`区域匹配: ${order.city}`);
        if (order.district && eng.area.includes(order.district)) {
          score += 5;
          reasons.push(`区县匹配: ${order.district}`);
        }
      }
    }

    const workload = db.prepare(`
      SELECT COUNT(*) as count FROM dispatch_records
      WHERE engineer_id = ? AND status IN ('pending', 'accepted')
    `).get(eng.id);
    if (workload.count === 0) {
      score += 10;
      reasons.push('当前无在处理工单');
    } else if (workload.count < 3) {
      score += 5;
      reasons.push(`当前${workload.count}个在处理工单`);
    } else {
      score -= workload.count * 3;
      reasons.push(`当前${workload.count}个在处理工单，工作量大`);
    }

    if (order.sla_deadline && new Date(order.sla_deadline) < new Date(Date.now() + 8 * 3600 * 1000)) {
      score += 10;
      reasons.push('SLA即将到期，需优先处理');
    }

    const recentCompleted = db.prepare(`
      SELECT COUNT(*) as count FROM dispatch_records dr
      JOIN work_orders wo ON dr.order_id = wo.id
      WHERE dr.engineer_id = ? AND dr.status = 'accepted' AND wo.status = 'completed'
        AND wo.updated_at > datetime('now', '-30 days')
    `).get(eng.id);
    if (recentCompleted.count > 5) {
      score += 5;
      reasons.push(`近30天完成${recentCompleted.count}单`);
    }

    return {
      engineer: { id: eng.id, name: eng.name, phone: eng.phone, skills, area: eng.area },
      score: Math.min(Math.max(score, 0), 100),
      reasons,
      currentWorkload: workload.count,
    };
  });

  recommendations.sort((a, b) => b.score - a.score);
  res.json(recommendations.slice(0, 5));
});

router.post('/assign', roleMiddleware(['dispatcher', 'service_agent']), (req, res) => {
  const { order_id, engineer_id, dispatch_type } = req.body;
  if (!order_id || !engineer_id) {
    return res.status(400).json({ error: '工单ID和工程师ID不能为空' });
  }

  const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(order_id);
  if (!order) {
    return res.status(404).json({ error: '工单不存在' });
  }
  if (order.status !== 'pending' && order.status !== 'dispatched') {
    return res.status(400).json({ error: '工单状态不允许派工' });
  }

  const engineer = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'engineer' AND status = 'active'").get(engineer_id);
  if (!engineer) {
    return res.status(404).json({ error: '工程师不存在或不可用' });
  }

  const existing = db.prepare('SELECT id FROM dispatch_records WHERE order_id = ? AND engineer_id = ? AND status IN (?, ?)').get(order_id, engineer_id, 'pending', 'accepted');
  if (existing) {
    return res.status(409).json({ error: '该工程师已被派单' });
  }

  const transaction = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO dispatch_records (order_id, engineer_id, dispatcher_id, dispatch_type, recommendation_score, recommendation_reason, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(order_id, engineer_id, req.user.id, dispatch_type || 'manual', 0, null);

    db.prepare("UPDATE work_orders SET status = 'dispatched', updated_at = datetime('now') WHERE id = ?").run(order_id);

    return result;
  });

  try {
    const result = transaction();
    const record = db.prepare(`
      SELECT dr.*, u.name as engineer_name, u.phone as engineer_phone
      FROM dispatch_records dr
      LEFT JOIN users u ON dr.engineer_id = u.id
      WHERE dr.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: '派工失败' });
  }
});

router.get('/pending', roleMiddleware(['dispatcher', 'service_agent']), (req, res) => {
  const orders = db.prepare(`
    SELECT wo.*, a.province, a.city, a.district, a.street, a.detail, a.contact_name, a.contact_phone
    FROM work_orders wo
    LEFT JOIN addresses a ON wo.address_id = a.id
    WHERE wo.status IN ('pending', 'dispatched')
    ORDER BY
      CASE wo.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
      END,
      wo.created_at ASC
  `).all();

  for (const order of orders) {
    order.photos = JSON.parse(order.photos || '[]');
    order.existingDispatches = db.prepare(`
      SELECT dr.*, u.name as engineer_name, u.phone as engineer_phone
      FROM dispatch_records dr
      LEFT JOIN users u ON dr.engineer_id = u.id
      WHERE dr.order_id = ?
      ORDER BY dr.dispatched_at DESC
    `).all(order.id);
  }

  res.json(orders);
});

router.patch('/:id/respond', (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: '状态必须为 accepted 或 rejected' });
  }

  const record = db.prepare('SELECT * FROM dispatch_records WHERE id = ? AND engineer_id = ?').get(req.params.id, req.user.id);
  if (!record) {
    return res.status(404).json({ error: '派工记录不存在' });
  }
  if (record.status !== 'pending') {
    return res.status(400).json({ error: '该派工记录已被处理' });
  }

  const transaction = db.transaction(() => {
    db.prepare("UPDATE dispatch_records SET status = ?, responded_at = datetime('now') WHERE id = ?").run(status, req.params.id);

    if (status === 'accepted') {
      db.prepare("UPDATE work_orders SET status = 'accepted', updated_at = datetime('now') WHERE id = ?").run(record.order_id);
      db.prepare("UPDATE dispatch_records SET status = 'cancelled' WHERE order_id = ? AND id != ? AND status = 'pending'").run(record.order_id, req.params.id);

      const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(record.order_id);
      db.prepare(`
        INSERT INTO service_records (order_id, engineer_id, accepted_at, status)
        VALUES (?, ?, datetime('now'), 'accepted')
      `).run(record.order_id, req.user.id);
    }

    if (status === 'rejected') {
      const otherAccepted = db.prepare("SELECT id FROM dispatch_records WHERE order_id = ? AND status = 'accepted'").get(record.order_id);
      if (!otherAccepted) {
        const otherPending = db.prepare("SELECT id FROM dispatch_records WHERE order_id = ? AND status = 'pending' AND id != ?").get(record.order_id, req.params.id);
        if (!otherPending) {
          db.prepare("UPDATE work_orders SET status = 'pending', updated_at = datetime('now') WHERE id = ?").run(record.order_id);
        }
      }
    }
  });

  try {
    transaction();
    const updated = db.prepare(`
      SELECT dr.*, u.name as engineer_name
      FROM dispatch_records dr
      LEFT JOIN users u ON dr.engineer_id = u.id
      WHERE dr.id = ?
    `).get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '响应派工失败' });
  }
});

export default router;
