import { Router } from 'express';
import db from '../db.js';

const router = Router();

function generateOrderNo() {
  const prefix = 'EXP';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

function generateTrackingNo(companyCode) {
  const random = Math.random().toString().replace('.', '').padEnd(12, '0').substring(0, 12);
  return `${companyCode}${random}`;
}

router.post('/', (req, res) => {
  try {
    const { user_id, company_id, sender_info, receiver_info, item_info, weight } = req.body;

    if (!user_id || !company_id) {
      return res.status(400).json({ error: '用户ID和快递公司ID不能为空' });
    }

    const orderNo = generateOrderNo();
    const company = db.prepare('SELECT code FROM express_company WHERE id = ?').get(company_id);
    const trackingNo = company ? generateTrackingNo(company.code) : null;

    const estimatedDays = Math.floor(Math.random() * 5) + 2;
    const estimatedDelivery = new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000);

    const stmt = db.prepare(`
      INSERT INTO express_order (order_no, tracking_no, user_id, company_id, sender_info, receiver_info, item_info, weight, estimated_delivery)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      orderNo,
      trackingNo,
      user_id,
      company_id,
      JSON.stringify(sender_info || {}),
      JSON.stringify(receiver_info || {}),
      JSON.stringify(item_info || {}),
      weight || 0,
      estimatedDelivery.toISOString()
    );

    const order = db.prepare('SELECT * FROM express_order WHERE id = ?').get(result.lastInsertRowid);
    order.sender_info = JSON.parse(order.sender_info || '{}');
    order.receiver_info = JSON.parse(order.receiver_info || '{}');
    order.item_info = JSON.parse(order.item_info || '{}');

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM express_order WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ error: '运单不存在' });
    }

    order.sender_info = JSON.parse(order.sender_info || '{}');
    order.receiver_info = JSON.parse(order.receiver_info || '{}');
    order.item_info = JSON.parse(order.item_info || '{}');

    const company = db.prepare('SELECT name, code FROM express_company WHERE id = ?').get(order.company_id);
    order.company = company;

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/user/:userId', (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM express_order WHERE user_id = ? ORDER BY created_at DESC').all(req.params.userId);
    orders.forEach(order => {
      order.sender_info = JSON.parse(order.sender_info || '{}');
      order.receiver_info = JSON.parse(order.receiver_info || '{}');
      order.item_info = JSON.parse(order.item_info || '{}');
      const company = db.prepare('SELECT name, code FROM express_company WHERE id = ?').get(order.company_id);
      order.company = company;
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: '状态不能为空' });
    }

    const stmt = db.prepare('UPDATE express_order SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(status, req.params.id);

    const order = db.prepare('SELECT * FROM express_order WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ error: '运单不存在' });
    }

    order.sender_info = JSON.parse(order.sender_info || '{}');
    order.receiver_info = JSON.parse(order.receiver_info || '{}');
    order.item_info = JSON.parse(order.item_info || '{}');

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM express_order WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ error: '运单不存在' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: '只有待揽收的运单才能取消' });
    }

    db.prepare('DELETE FROM express_order WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
