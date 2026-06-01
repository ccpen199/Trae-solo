import express from 'express';
import db from '../database.js';

const router = express.Router();

function generateNo(prefix) {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${dateStr}${rand}`;
}

router.get('/stock', (req, res) => {
  const { page = 1, pageSize = 20, keyword, location_id, low_stock } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (keyword) {
    whereClause += ' AND (sp.name LIKE ? OR sp.sku LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (location_id) {
    whereClause += ' AND st.location_id = ?';
    params.push(location_id);
  }
  if (low_stock === 'true') {
    whereClause += ' AND st.available_qty < sp.safety_stock';
  }

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM stock st
    JOIN spare_parts sp ON st.part_id = sp.id
    ${whereClause}
  `).get(...params).count;

  const list = db.prepare(`
    SELECT st.*, sp.name as part_name, sp.sku, sp.model, sp.safety_stock, sp.unit,
           l.name as location_name, l.code as location_code
    FROM stock st
    JOIN spare_parts sp ON st.part_id = sp.id
    JOIN locations l ON st.location_id = l.id
    ${whereClause}
    ORDER BY st.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({ success: true, data: list, total });
});

router.get('/transactions', (req, res) => {
  const { page = 1, pageSize = 20, trans_type, part_id, start_date, end_date } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (trans_type) {
    whereClause += ' AND t.trans_type = ?';
    params.push(trans_type);
  }
  if (part_id) {
    whereClause += ' AND t.part_id = ?';
    params.push(part_id);
  }
  if (start_date) {
    whereClause += ' AND DATE(t.created_at) >= ?';
    params.push(start_date);
  }
  if (end_date) {
    whereClause += ' AND DATE(t.created_at) <= ?';
    params.push(end_date);
  }

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM stock_transactions t ${whereClause}
  `).get(...params).count;

  const list = db.prepare(`
    SELECT t.*, sp.name as part_name, sp.sku, l.name as location_name
    FROM stock_transactions t
    JOIN spare_parts sp ON t.part_id = sp.id
    LEFT JOIN locations l ON t.location_id = l.id
    ${whereClause}
    ORDER BY t.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({ success: true, data: list, total });
});

router.post('/return', (req, res) => {
  const { out_id, part_id, location_id, batch_no, quantity, return_reason, condition, remark } = req.body;

  if (!part_id || !location_id || !quantity) {
    return res.status(400).json({ success: false, message: '备件、库位和数量为必填项' });
  }

  const return_no = generateNo('RET');

  try {
    db.prepare(`
      INSERT INTO stock_returns (return_no, out_id, part_id, location_id, batch_no, quantity, return_reason, condition, remark, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(return_no, out_id, part_id, location_id, batch_no, quantity, return_reason, condition, remark, 1);

    res.json({ success: true, data: { return_no } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/return/:id/approve', (req, res) => {
  const { id } = req.params;

  const ret = db.prepare('SELECT * FROM stock_returns WHERE id = ?').get(id);
  if (!ret) {
    return res.status(404).json({ success: false, message: '退库单不存在' });
  }

  if (ret.status !== 'pending') {
    return res.status(400).json({ success: false, message: '退库单状态不允许审批' });
  }

  const trans_no = generateNo('TR');

  try {
    if (ret.condition === 'good') {
      const existing = db.prepare(`
        SELECT * FROM stock WHERE part_id = ? AND location_id = ? AND batch_no = ?
      `).get(ret.part_id, ret.location_id, ret.batch_no);

      if (existing) {
        db.prepare(`
          UPDATE stock SET available_qty = available_qty + ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(ret.quantity, existing.id);
      }
    }

    db.prepare(`
      INSERT INTO stock_transactions (trans_no, trans_type, ref_id, ref_no, part_id, location_id, batch_no, qty_change, created_by, remark)
      VALUES (?, 'return', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(trans_no, ret.id, ret.return_no, ret.part_id, ret.location_id, ret.batch_no, ret.quantity, 1, '退回入库');

    db.prepare(`
      UPDATE stock_returns SET status = 'completed', inspector_id = ?
      WHERE id = ?
    `).run(1, id);

    res.json({ success: true, message: '退库审批通过' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/scrap', (req, res) => {
  const { part_id, location_id, batch_no, quantity, scrap_reason, remark } = req.body;

  if (!part_id || !location_id || !quantity || !scrap_reason) {
    return res.status(400).json({ success: false, message: '备件、库位、数量和报废原因为必填项' });
  }

  const scrap_no = generateNo('SCR');

  try {
    db.prepare(`
      INSERT INTO stock_scrap (scrap_no, part_id, location_id, batch_no, quantity, scrap_reason, remark, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(scrap_no, part_id, location_id, batch_no, quantity, scrap_reason, remark, 1);

    res.json({ success: true, data: { scrap_no } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/scrap/:id/approve', (req, res) => {
  const { id } = req.params;

  const scrap = db.prepare('SELECT * FROM stock_scrap WHERE id = ?').get(id);
  if (!scrap) {
    return res.status(404).json({ success: false, message: '报废单不存在' });
  }

  if (scrap.status !== 'pending') {
    return res.status(400).json({ success: false, message: '报废单状态不允许审批' });
  }

  const stock = db.prepare(`
    SELECT * FROM stock
    WHERE part_id = ? AND location_id = ? AND batch_no = ?
  `).get(scrap.part_id, scrap.location_id, scrap.batch_no);

  if (!stock || stock.available_qty < scrap.quantity) {
    return res.status(400).json({ success: false, message: '库存不足' });
  }

  const trans_no = generateNo('TR');

  try {
    db.prepare(`
      UPDATE stock SET quantity = quantity - ?, available_qty = available_qty - ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(scrap.quantity, scrap.quantity, stock.id);

    db.prepare(`
      INSERT INTO stock_transactions (trans_no, trans_type, ref_id, ref_no, part_id, location_id, batch_no, qty_change, created_by, remark)
      VALUES (?, 'scrap', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(trans_no, scrap.id, scrap.scrap_no, scrap.part_id, scrap.location_id, scrap.batch_no, -scrap.quantity, 1, '报废出库');

    db.prepare(`
      UPDATE stock_scrap SET status = 'completed', approver_id = ?
      WHERE id = ?
    `).run(1, id);

    res.json({ success: true, message: '报废审批通过' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/transfer', (req, res) => {
  const { part_id, from_location_id, to_location_id, batch_no, quantity, remark } = req.body;

  if (!part_id || !from_location_id || !to_location_id || !quantity) {
    return res.status(400).json({ success: false, message: '备件、调出库位、调入库位和数量为必填项' });
  }

  const transfer_no = generateNo('TRF');

  try {
    db.prepare(`
      INSERT INTO stock_transfer (transfer_no, part_id, from_location_id, to_location_id, batch_no, quantity, remark, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(transfer_no, part_id, from_location_id, to_location_id, batch_no, quantity, remark, 1);

    res.json({ success: true, data: { transfer_no } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/transfer/:id/approve', (req, res) => {
  const { id } = req.params;

  const transfer = db.prepare('SELECT * FROM stock_transfer WHERE id = ?').get(id);
  if (!transfer) {
    return res.status(404).json({ success: false, message: '调拨单不存在' });
  }

  if (transfer.status !== 'pending') {
    return res.status(400).json({ success: false, message: '调拨单状态不允许审批' });
  }

  const fromStock = db.prepare(`
    SELECT * FROM stock
    WHERE part_id = ? AND location_id = ? AND batch_no = ?
  `).get(transfer.part_id, transfer.from_location_id, transfer.batch_no);

  if (!fromStock || fromStock.available_qty < transfer.quantity) {
    return res.status(400).json({ success: false, message: '调出库位库存不足' });
  }

  const trans_no_out = generateNo('TR');
  const trans_no_in = generateNo('TR');

  try {
    db.prepare(`
      UPDATE stock SET available_qty = available_qty - ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(transfer.quantity, fromStock.id);

    const toStock = db.prepare(`
      SELECT * FROM stock
      WHERE part_id = ? AND location_id = ? AND batch_no = ?
    `).get(transfer.part_id, transfer.to_location_id, transfer.batch_no);

    if (toStock) {
      db.prepare(`
        UPDATE stock SET quantity = quantity + ?, available_qty = available_qty + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(transfer.quantity, transfer.quantity, toStock.id);
    } else {
      db.prepare(`
        INSERT INTO stock (part_id, location_id, batch_no, quantity, available_qty, unit_price)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(transfer.part_id, transfer.to_location_id, transfer.batch_no, transfer.quantity, transfer.quantity, fromStock.unit_price);
    }

    db.prepare(`
      INSERT INTO stock_transactions (trans_no, trans_type, ref_id, ref_no, part_id, location_id, batch_no, qty_change, created_by, remark)
      VALUES (?, 'transfer_out', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(trans_no_out, transfer.id, transfer.transfer_no, transfer.part_id, transfer.from_location_id, transfer.batch_no, -transfer.quantity, 1, '调拨出库');

    db.prepare(`
      INSERT INTO stock_transactions (trans_no, trans_type, ref_id, ref_no, part_id, location_id, batch_no, qty_change, created_by, remark)
      VALUES (?, 'transfer_in', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(trans_no_in, transfer.id, transfer.transfer_no, transfer.part_id, transfer.to_location_id, transfer.batch_no, transfer.quantity, 1, '调拨入库');

    db.prepare(`
      UPDATE stock_transfer SET status = 'completed', approver_id = ?
      WHERE id = ?
    `).run(1, id);

    res.json({ success: true, message: '调拨审批通过' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/take', (req, res) => {
  const { location_id, take_date, items, remark } = req.body;

  if (!take_date || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: '盘点日期和盘点明细为必填项' });
  }

  const take_no = generateNo('TAK');

  try {
    const stmt = db.prepare(`
      INSERT INTO stock_take (take_no, location_id, take_date, remark, created_by)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(take_no, location_id, take_date, remark, 1);
    const takeId = result.lastInsertRowid;

    const itemStmt = db.prepare(`
      INSERT INTO stock_take_items (take_id, part_id, batch_no, system_qty, actual_qty, diff_qty, diff_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      itemStmt.run(takeId, item.part_id, item.batch_no, item.system_qty, item.actual_qty, item.diff_qty, item.diff_amount);
    }

    res.json({ success: true, data: { take_no, id: takeId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/take/:id/approve', (req, res) => {
  const { id } = req.params;

  const take = db.prepare('SELECT * FROM stock_take WHERE id = ?').get(id);
  if (!take) {
    return res.status(404).json({ success: false, message: '盘点单不存在' });
  }

  if (take.status !== 'draft') {
    return res.status(400).json({ success: false, message: '盘点单状态不允许审批' });
  }

  const items = db.prepare('SELECT * FROM stock_take_items WHERE take_id = ?').all(id);

  try {
    for (const item of items) {
      if (item.diff_qty !== 0) {
        const stock = db.prepare(`
          SELECT * FROM stock
          WHERE part_id = ? AND location_id = ? AND batch_no = ?
        `).get(item.part_id, take.location_id || 1, item.batch_no);

        if (stock) {
          db.prepare(`
            UPDATE stock
            SET quantity = quantity + ?, available_qty = available_qty + ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(item.diff_qty, item.diff_qty, stock.id);

          const trans_no = generateNo('TR');
          db.prepare(`
            INSERT INTO stock_transactions (trans_no, trans_type, ref_id, ref_no, part_id, location_id, batch_no, qty_change, created_by, remark)
            VALUES (?, 'take', ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(trans_no, take.id, take.take_no, item.part_id, take.location_id || 1, item.batch_no, item.diff_qty, 1, item.diff_qty > 0 ? '盘盈' : '盘亏');
        }
      }
    }

    db.prepare(`
      UPDATE stock_take SET status = 'approved', approver_id = ?
      WHERE id = ?
    `).run(1, id);

    res.json({ success: true, message: '盘点审批通过' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/returns', (req, res) => {
  const { page = 1, pageSize = 20, status } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = status ? 'WHERE sr.status = ?' : 'WHERE 1=1';
  const params = status ? [status] : [];

  const total = db.prepare(`SELECT COUNT(*) as count FROM stock_returns sr ${whereClause}`).get(...params).count;

  const list = db.prepare(`
    SELECT sr.*, sp.name as part_name, sp.sku, l.name as location_name,
           u.name as inspector_name
    FROM stock_returns sr
    JOIN spare_parts sp ON sr.part_id = sp.id
    JOIN locations l ON sr.location_id = l.id
    LEFT JOIN users u ON sr.inspector_id = u.id
    ${whereClause}
    ORDER BY sr.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({ success: true, data: list, total });
});

router.get('/scraps', (req, res) => {
  const { page = 1, pageSize = 20, status } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = status ? 'WHERE ss.status = ?' : 'WHERE 1=1';
  const params = status ? [status] : [];

  const total = db.prepare(`SELECT COUNT(*) as count FROM stock_scrap ss ${whereClause}`).get(...params).count;

  const list = db.prepare(`
    SELECT ss.*, sp.name as part_name, sp.sku, l.name as location_name,
           u.name as approver_name
    FROM stock_scrap ss
    JOIN spare_parts sp ON ss.part_id = sp.id
    JOIN locations l ON ss.location_id = l.id
    LEFT JOIN users u ON ss.approver_id = u.id
    ${whereClause}
    ORDER BY ss.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({ success: true, data: list, total });
});

router.get('/transfers', (req, res) => {
  const { page = 1, pageSize = 20, status } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = status ? 'WHERE st.status = ?' : 'WHERE 1=1';
  const params = status ? [status] : [];

  const total = db.prepare(`SELECT COUNT(*) as count FROM stock_transfer st ${whereClause}`).get(...params).count;

  const list = db.prepare(`
    SELECT st.*, sp.name as part_name, sp.sku,
           l1.name as from_location_name,
           l2.name as to_location_name,
           u.name as approver_name
    FROM stock_transfer st
    JOIN spare_parts sp ON st.part_id = sp.id
    JOIN locations l1 ON st.from_location_id = l1.id
    JOIN locations l2 ON st.to_location_id = l2.id
    LEFT JOIN users u ON st.approver_id = u.id
    ${whereClause}
    ORDER BY st.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({ success: true, data: list, total });
});

router.get('/takes', (req, res) => {
  const { page = 1, pageSize = 20, status } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = status ? 'WHERE st.status = ?' : 'WHERE 1=1';
  const params = status ? [status] : [];

  const total = db.prepare(`SELECT COUNT(*) as count FROM stock_take st ${whereClause}`).get(...params).count;

  const list = db.prepare(`
    SELECT st.*, l.name as location_name, u.name as approver_name
    FROM stock_take st
    LEFT JOIN locations l ON st.location_id = l.id
    LEFT JOIN users u ON st.approver_id = u.id
    ${whereClause}
    ORDER BY st.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({ success: true, data: list, total });
});

export default router;
