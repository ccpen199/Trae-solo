import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/:trackingNo', (req, res) => {
  try {
    const { trackingNo } = req.params;

    const order = db.prepare('SELECT * FROM express_order WHERE tracking_no = ?').get(trackingNo);
    if (!order) {
      return res.status(404).json({ error: '未找到该运单' });
    }

    const nodes = db.prepare('SELECT * FROM tracking_node WHERE order_id = ? ORDER BY timestamp ASC').all(order.id);

    const company = db.prepare('SELECT id, name, code FROM express_company WHERE id = ?').get(order.company_id);

    res.json({
      id: order.id,
      order_no: order.order_no,
      tracking_no: order.tracking_no,
      status: order.status,
      weight: order.weight,
      price: order.price,
      sender_info: JSON.parse(order.sender_info || '{}'),
      receiver_info: JSON.parse(order.receiver_info || '{}'),
      item_info: JSON.parse(order.item_info || '{}'),
      estimated_delivery: order.estimated_delivery,
      company: company,
      nodes: nodes.map(node => ({
        ...node,
        raw_data: node.raw_data ? JSON.parse(node.raw_data) : null
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:trackingNo', (req, res) => {
  try {
    const { trackingNo } = req.params;
    const { status, location, description, timestamp, raw_data } = req.body;

    const order = db.prepare('SELECT * FROM express_order WHERE tracking_no = ?').get(trackingNo);
    if (!order) {
      return res.status(404).json({ error: '未找到该运单' });
    }

    const stmt = db.prepare(`
      INSERT INTO tracking_node (order_id, status, location, description, timestamp, raw_data)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      order.id,
      status || '',
      location || '',
      description || '',
      timestamp || new Date().toISOString(),
      JSON.stringify(raw_data || {})
    );

    db.prepare('UPDATE express_order SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(order.id);

    const node = db.prepare('SELECT * FROM tracking_node WHERE id = ?').get(result.lastInsertRowid);
    node.raw_data = JSON.parse(node.raw_data || '{}');

    res.json(node);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:trackingNo/predict', (req, res) => {
  try {
    const { trackingNo } = req.params;

    const order = db.prepare('SELECT * FROM express_order WHERE tracking_no = ?').get(trackingNo);
    if (!order) {
      return res.status(404).json({ error: '未找到该运单' });
    }

    const confidence = Math.floor(Math.random() * 20) + 75;
    const hoursRemaining = Math.floor(Math.random() * 48) + 2;
    const predictedTime = new Date(Date.now() + hoursRemaining * 60 * 60 * 1000);

    res.json({
      tracking_no: trackingNo,
      predicted_time: predictedTime.toISOString(),
      confidence: confidence,
      factors: {
        distance: Math.floor(Math.random() * 1000) + 100,
        weather_factor: Math.random() > 0.5 ? '良好' : '一般',
        traffic_factor: Math.random() > 0.5 ? '畅通' : '繁忙'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
