import express from 'express';
import db from '../database.js';

const router = express.Router();

function generateNo(prefix) {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${dateStr}${rand}`;
}

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, status, engineer_id } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (status) {
    whereClause += ' AND wo.status = ?';
    params.push(status);
  }
  if (engineer_id) {
    whereClause += ' AND wo.engineer_id = ?';
    params.push(engineer_id);
  }

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM work_orders wo ${whereClause}
  `).get(...params).count;

  const list = db.prepare(`
    SELECT wo.*, u.name as engineer_name
    FROM work_orders wo
    LEFT JOIN users u ON wo.engineer_id = u.id
    ${whereClause}
    ORDER BY wo.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({ success: true, data: list, total });
});

router.get('/:id', (req, res) => {
  const wo = db.prepare(`
    SELECT wo.*, u.name as engineer_name
    FROM work_orders wo
    LEFT JOIN users u ON wo.engineer_id = u.id
    WHERE wo.id = ?
  `).get(req.params.id);

  if (!wo) {
    return res.status(404).json({ success: false, message: '工单不存在' });
  }

  const stockOuts = db.prepare(`
    SELECT so.*, sp.name as part_name, sp.sku, sp.model
    FROM stock_out so
    JOIN spare_parts sp ON so.part_id = sp.id
    WHERE so.wo_id = ?
  `).all(req.params.id);

  res.json({ success: true, data: { ...wo, stockOuts } });
});

router.post('/', (req, res) => {
  const { device_model, device_sn, customer_name, fault_description, engineer_id, priority, remark } = req.body;

  if (!device_model || !fault_description) {
    return res.status(400).json({ success: false, message: '设备型号和故障描述为必填项' });
  }

  const wo_no = generateNo('WO');

  try {
    const stmt = db.prepare(`
      INSERT INTO work_orders (wo_no, device_model, device_sn, customer_name, fault_description, engineer_id, priority, remark, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(wo_no, device_model, device_sn, customer_name, fault_description, engineer_id, priority || 'normal', remark, 1);
    res.json({ success: true, data: { id: result.lastInsertRowid, wo_no } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ success: false, message: '状态无效' });
  }

  db.prepare(`
    UPDATE work_orders SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, id);

  res.json({ success: true, message: '状态更新成功' });
});

router.post('/:id/request-part', (req, res) => {
  const { part_id, location_id, batch_no, quantity, purpose, remark } = req.body;
  const { id } = req.params;

  if (!part_id || !location_id || !quantity) {
    return res.status(400).json({ success: false, message: '备件、库位和数量为必填项' });
  }

  const wo = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id);
  if (!wo) {
    return res.status(404).json({ success: false, message: '工单不存在' });
  }

  if (!['pending', 'processing'].includes(wo.status)) {
    return res.status(400).json({ success: false, message: '工单状态不允许领用备件' });
  }

  const part = db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(part_id);
  if (!part) {
    return res.status(404).json({ success: false, message: '备件不存在' });
  }

  const stock = db.prepare(`
    SELECT * FROM stock
    WHERE part_id = ? AND location_id = ? AND (batch_no = ? OR batch_no IS NULL)
      AND available_qty >= ?
    ORDER BY expire_date ASC NULLS LAST
    LIMIT 1
  `).get(part_id, location_id, batch_no || '', quantity);

  if (!stock) {
    return res.status(400).json({ success: false, message: '库存不足' });
  }

  const out_no = generateNo('OUT');

  try {
    db.prepare(`
      INSERT INTO stock_out (out_no, wo_id, part_id, location_id, batch_no, quantity, unit_price, engineer_id, purpose, remark, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(out_no, id, part_id, location_id, stock.batch_no, quantity, stock.unit_price, wo.engineer_id || 3, purpose, remark, 1);

    res.json({ success: true, data: { out_no } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
