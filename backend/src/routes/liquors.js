const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { status, brand_id, supplier_id } = req.query;
  let sql = `
    SELECT l.*, b.name as brand_name, s.name as supplier_name
    FROM liquors l
    LEFT JOIN liquor_brands b ON l.brand_id = b.id
    LEFT JOIN suppliers s ON l.supplier_id = s.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND l.status = ?';
    params.push(status);
  }
  if (brand_id) {
    sql += ' AND l.brand_id = ?';
    params.push(brand_id);
  }
  if (supplier_id) {
    sql += ' AND l.supplier_id = ?';
    params.push(supplier_id);
  }
  
  sql += ' ORDER BY l.created_at DESC';
  
  const liquors = db.prepare(sql).all(...params);
  res.json(liquors);
});

router.get('/:id', (req, res) => {
  const liquor = db.prepare(`
    SELECT l.*, b.name as brand_name, s.name as supplier_name
    FROM liquors l
    LEFT JOIN liquor_brands b ON l.brand_id = b.id
    LEFT JOIN suppliers s ON l.supplier_id = s.id
    WHERE l.id = ?
  `).get(req.params.id);
  
  if (!liquor) {
    return res.status(404).json({ error: '酒水不存在' });
  }
  res.json(liquor);
});

router.post('/', (req, res) => {
  const {
    name, brand_id, specification, bottle_volume_ml,
    cost_price, sale_price, supplier_id, batch_number,
    unit, conversion_factor, min_stock
  } = req.body;

  try {
    const result = db.prepare(`
      INSERT INTO liquors (
        name, brand_id, specification, bottle_volume_ml,
        cost_price, sale_price, supplier_id, batch_number,
        unit, conversion_factor, min_stock
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, brand_id || null, specification, bottle_volume_ml,
      cost_price, sale_price, supplier_id || null, batch_number,
      unit || '瓶', conversion_factor || 1, min_stock || 0
    );
    
    const liquor = db.prepare('SELECT * FROM liquors WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(liquor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const {
    name, brand_id, specification, bottle_volume_ml,
    cost_price, sale_price, supplier_id, batch_number,
    unit, conversion_factor, min_stock, status
  } = req.body;

  try {
    db.prepare(`
      UPDATE liquors SET
        name = ?, brand_id = ?, specification = ?, bottle_volume_ml = ?,
        cost_price = ?, sale_price = ?, supplier_id = ?, batch_number = ?,
        unit = ?, conversion_factor = ?, min_stock = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name, brand_id || null, specification, bottle_volume_ml,
      cost_price, sale_price, supplier_id || null, batch_number,
      unit || '瓶', conversion_factor || 1, min_stock || 0, status || 'active',
      req.params.id
    );
    
    const liquor = db.prepare('SELECT * FROM liquors WHERE id = ?').get(req.params.id);
    res.json(liquor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/stock-adjust', (req, res) => {
  const { quantity, reason, created_by, approver_id } = req.body;
  const liquorId = req.params.id;
  
  const liquor = db.prepare('SELECT * FROM liquors WHERE id = ?').get(liquorId);
  if (!liquor) {
    return res.status(404).json({ error: '酒水不存在' });
  }

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE liquors 
      SET total_bottles = total_bottles + ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(quantity, liquorId);
    
    db.prepare(`
      INSERT INTO stock_transactions (
        liquor_id, transaction_type, quantity, unit, reason, created_by, approver_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      liquorId,
      quantity > 0 ? 'stock_in' : 'stock_out',
      Math.abs(quantity),
      '瓶',
      reason,
      created_by || 1,
      approver_id || null
    );
  });
  
  try {
    transaction();
    const updated = db.prepare('SELECT * FROM liquors WHERE id = ?').get(liquorId);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
