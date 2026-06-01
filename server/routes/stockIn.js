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
  const { page = 1, pageSize = 20, status, keyword } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (status) {
    whereClause += ' AND si.status = ?';
    params.push(status);
  }
  if (keyword) {
    whereClause += ' AND (si.in_no LIKE ? OR sp.name LIKE ? OR sp.sku LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM stock_in si
    JOIN spare_parts sp ON si.part_id = sp.id
    ${whereClause}
  `).get(...params).count;

  const list = db.prepare(`
    SELECT si.*, sp.name as part_name, sp.sku, sp.model,
           s.name as supplier_name, l.name as location_name,
           u.name as inspector_name
    FROM stock_in si
    JOIN spare_parts sp ON si.part_id = sp.id
    LEFT JOIN suppliers s ON si.supplier_id = s.id
    JOIN locations l ON si.location_id = l.id
    LEFT JOIN users u ON si.inspector_id = u.id
    ${whereClause}
    ORDER BY si.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({ success: true, data: list, total });
});

router.post('/', (req, res) => {
  const { po_id, supplier_id, batch_no, part_id, location_id, quantity, unit_price, expire_date, remark } = req.body;

  if (!batch_no || !part_id || !location_id || !quantity) {
    return res.status(400).json({ success: false, message: '批次、备件、库位和数量为必填项' });
  }

  const part = db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(part_id);
  if (!part) {
    return res.status(400).json({ success: false, message: '备件不存在' });
  }

  const in_no = generateNo('IN');

  try {
    db.prepare(`
      INSERT INTO stock_in (in_no, po_id, supplier_id, batch_no, part_id, location_id, quantity, unit_price, expire_date, remark, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(in_no, po_id, supplier_id, batch_no, part_id, location_id, quantity, unit_price || part.purchase_price, expire_date, remark, 1);

    res.json({ success: true, data: { in_no } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/inspect', (req, res) => {
  const { inspection_result, inspection_remark } = req.body;
  const { id } = req.params;

  if (!['pass', 'fail'].includes(inspection_result)) {
    return res.status(400).json({ success: false, message: '质检结果无效' });
  }

  const stockIn = db.prepare('SELECT * FROM stock_in WHERE id = ?').get(id);
  if (!stockIn) {
    return res.status(404).json({ success: false, message: '入库单不存在' });
  }

  if (stockIn.status !== 'pending') {
    return res.status(400).json({ success: false, message: '入库单状态不允许质检' });
  }

  const trans_no = generateNo('TR');

  try {
    if (inspection_result === 'pass') {
      const existing = db.prepare(`
        SELECT * FROM stock WHERE part_id = ? AND location_id = ? AND batch_no = ?
      `).get(stockIn.part_id, stockIn.location_id, stockIn.batch_no);

      if (existing) {
        db.prepare(`
          UPDATE stock SET quantity = quantity + ?, available_qty = available_qty + ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(stockIn.quantity, stockIn.quantity, existing.id);
      } else {
        db.prepare(`
          INSERT INTO stock (part_id, location_id, batch_no, quantity, available_qty, unit_price, expire_date)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(stockIn.part_id, stockIn.location_id, stockIn.batch_no, stockIn.quantity, stockIn.quantity, stockIn.unit_price, stockIn.expire_date);
      }

      db.prepare(`
        INSERT INTO stock_transactions (trans_no, trans_type, ref_id, ref_no, part_id, location_id, batch_no, qty_change, unit_price, created_by, remark)
        VALUES (?, 'in', ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(trans_no, stockIn.id, stockIn.in_no, stockIn.part_id, stockIn.location_id, stockIn.batch_no, stockIn.quantity, stockIn.unit_price, 1, '入库');
    }

    db.prepare(`
      UPDATE stock_in
      SET inspection_result = ?, inspection_remark = ?, inspector_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(inspection_result, inspection_remark, 1, inspection_result === 'pass' ? 'completed' : 'rejected', id);

    res.json({ success: true, message: '质检完成' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/invoice', (req, res) => {
  const { invoice_status, invoice_no } = req.body;
  const { id } = req.params;

  db.prepare(`
    UPDATE stock_in SET invoice_status = ?, invoice_no = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(invoice_status, invoice_no, id);

  res.json({ success: true, message: '发票状态更新成功' });
});

export default router;
