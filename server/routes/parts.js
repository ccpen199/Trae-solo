import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, keyword, category, status } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (keyword) {
    whereClause += ' AND (sp.sku LIKE ? OR sp.name LIKE ? OR sp.model LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (category) {
    whereClause += ' AND sp.category = ?';
    params.push(category);
  }
  if (status !== undefined) {
    whereClause += ' AND sp.status = ?';
    params.push(status);
  }

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM spare_parts sp ${whereClause}
  `).get(...params).count;

  const parts = db.prepare(`
    SELECT sp.*, s.name as supplier_name, s.code as supplier_code,
           COALESCE(SUM(st.available_qty), 0) as total_stock
    FROM spare_parts sp
    LEFT JOIN suppliers s ON sp.supplier_id = s.id
    LEFT JOIN stock st ON sp.id = st.part_id
    ${whereClause}
    GROUP BY sp.id
    ORDER BY sp.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({ success: true, data: parts, total });
});

router.get('/:id', (req, res) => {
  const part = db.prepare(`
    SELECT sp.*, s.name as supplier_name, s.code as supplier_code,
           COALESCE(SUM(st.available_qty), 0) as total_stock
    FROM spare_parts sp
    LEFT JOIN suppliers s ON sp.supplier_id = s.id
    LEFT JOIN stock st ON sp.id = st.part_id
    WHERE sp.id = ?
    GROUP BY sp.id
  `).get(req.params.id);

  if (!part) {
    return res.status(404).json({ success: false, message: '备件不存在' });
  }

  const stockList = db.prepare(`
    SELECT st.*, l.name as location_name, l.code as location_code
    FROM stock st
    JOIN locations l ON st.location_id = l.id
    WHERE st.part_id = ?
  `).all(req.params.id);

  res.json({ success: true, data: { ...part, stockList } });
});

router.post('/', (req, res) => {
  const { sku, name, model, category, compatible_devices, supplier_id, purchase_price, shelf_life_months, safety_stock, alternative_parts, specifications, unit } = req.body;

  if (!sku || !name || !purchase_price) {
    return res.status(400).json({ success: false, message: 'SKU、名称和采购价为必填项' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO spare_parts (sku, name, model, category, compatible_devices, supplier_id, purchase_price, shelf_life_months, safety_stock, alternative_parts, specifications, unit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(sku, name, model, category, compatible_devices, supplier_id, purchase_price, shelf_life_months, safety_stock, alternative_parts, specifications, unit || '个');
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ success: false, message: 'SKU已存在' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { sku, name, model, category, compatible_devices, supplier_id, purchase_price, shelf_life_months, safety_stock, alternative_parts, specifications, unit, status } = req.body;

  try {
    const stmt = db.prepare(`
      UPDATE spare_parts
      SET sku = ?, name = ?, model = ?, category = ?, compatible_devices = ?, supplier_id = ?, purchase_price = ?, shelf_life_months = ?, safety_stock = ?, alternative_parts = ?, specifications = ?, unit = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(sku, name, model, category, compatible_devices, supplier_id, purchase_price, shelf_life_months, safety_stock, alternative_parts, specifications, unit, status, req.params.id);
    res.json({ success: true, message: '更新成功' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ success: false, message: 'SKU已存在' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const stock = db.prepare('SELECT * FROM stock WHERE part_id = ?').get(req.params.id);
  if (stock) {
    return res.status(400).json({ success: false, message: '该备件存在库存，无法删除' });
  }

  db.prepare('DELETE FROM spare_parts WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: '删除成功' });
});

export default router;
