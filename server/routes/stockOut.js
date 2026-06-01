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
  const { page = 1, pageSize = 20, status, wo_id } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (status) {
    whereClause += ' AND so.status = ?';
    params.push(status);
  }
  if (wo_id) {
    whereClause += ' AND so.wo_id = ?';
    params.push(wo_id);
  }

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM stock_out so ${whereClause}
  `).get(...params).count;

  const list = db.prepare(`
    SELECT so.*, sp.name as part_name, sp.sku, sp.model,
           wo.wo_no, l.name as location_name,
           u.name as engineer_name
    FROM stock_out so
    JOIN spare_parts sp ON so.part_id = sp.id
    LEFT JOIN work_orders wo ON so.wo_id = wo.id
    JOIN locations l ON so.location_id = l.id
    LEFT JOIN users u ON so.engineer_id = u.id
    ${whereClause}
    ORDER BY so.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({ success: true, data: list, total });
});

router.post('/:id/approve', (req, res) => {
  const { id } = req.params;

  const stockOut = db.prepare('SELECT * FROM stock_out WHERE id = ?').get(id);
  if (!stockOut) {
    return res.status(404).json({ success: false, message: '出库单不存在' });
  }

  if (stockOut.status !== 'pending') {
    return res.status(400).json({ success: false, message: '出库单状态不允许审批' });
  }

  const stock = db.prepare(`
    SELECT * FROM stock
    WHERE part_id = ? AND location_id = ? AND batch_no = ?
  `).get(stockOut.part_id, stockOut.location_id, stockOut.batch_no);

  if (!stock || stock.available_qty < stockOut.quantity) {
    return res.status(400).json({ success: false, message: '库存不足，无法出库' });
  }

  const trans_no = generateNo('TR');

  try {
    db.prepare(`
      UPDATE stock
      SET available_qty = available_qty - ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(stockOut.quantity, stock.id);

    db.prepare(`
      INSERT INTO stock_transactions (trans_no, trans_type, ref_id, ref_no, part_id, location_id, batch_no, qty_change, unit_price, created_by, remark)
      VALUES (?, 'out', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(trans_no, stockOut.id, stockOut.out_no, stockOut.part_id, stockOut.location_id, stockOut.batch_no, -stockOut.quantity, stockOut.unit_price, 1, '出库');

    db.prepare(`
      UPDATE stock_out
      SET status = 'completed', approver_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(1, id);

    res.json({ success: true, message: '审批通过，出库完成' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/reject', (req, res) => {
  const { id } = req.params;

  const stockOut = db.prepare('SELECT * FROM stock_out WHERE id = ?').get(id);
  if (!stockOut) {
    return res.status(404).json({ success: false, message: '出库单不存在' });
  }

  if (stockOut.status !== 'pending') {
    return res.status(400).json({ success: false, message: '出库单状态不允许拒绝' });
  }

  db.prepare(`
    UPDATE stock_out SET status = 'rejected', approver_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(1, id);

  res.json({ success: true, message: '已拒绝' });
});

export default router;
