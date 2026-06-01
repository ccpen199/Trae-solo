const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM stock_takes WHERE 1=1';
  const params = [];
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY take_date DESC';
  
  const stockTakes = db.prepare(sql).all(...params);
  res.json(stockTakes);
});

router.get('/:id', (req, res) => {
  const stockTake = db.prepare('SELECT * FROM stock_takes WHERE id = ?').get(req.params.id);
  
  if (!stockTake) {
    return res.status(404).json({ error: '盘点记录不存在' });
  }
  
  const items = db.prepare(`
    SELECT sti.*, l.name as liquor_name, l.specification
    FROM stock_take_items sti
    JOIN liquors l ON sti.liquor_id = l.id
    WHERE sti.stock_take_id = ?
  `).all(req.params.id);
  
  stockTake.items = items;
  res.json(stockTake);
});

router.post('/', (req, res) => {
  const { take_date, items, created_by } = req.body;

  const transaction = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO stock_takes (take_date, created_by)
      VALUES (?, ?)
    `).run(take_date || new Date().toISOString().split('T')[0], created_by || 1);
    
    const stockTakeId = result.lastInsertRowid;
    const insertItem = db.prepare(`
      INSERT INTO stock_take_items (
        stock_take_id, liquor_id, expected_bottles, expected_opened,
        actual_bottles, actual_opened, variance, is_abnormal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const liquors = db.prepare("SELECT id, total_bottles, opened_bottles FROM liquors WHERE status = 'active'").all();
    
    let totalExpected = 0;
    let totalActual = 0;
    
    for (const liquor of liquors) {
      const actualItem = items?.find(i => i.liquor_id === liquor.id);
      const expectedTotal = liquor.total_bottles * 1000 + liquor.opened_bottles;
      const actualBottles = actualItem?.actual_bottles !== undefined ? actualItem.actual_bottles : liquor.total_bottles;
      const actualOpened = actualItem?.actual_opened !== undefined ? actualItem.actual_opened : liquor.opened_bottles;
      const actualTotal = actualBottles * 1000 + actualOpened;
      const variance = actualTotal - expectedTotal;
      const isAbnormal = Math.abs(variance) > 1000;
      
      totalExpected += expectedTotal;
      totalActual += actualTotal;
      
      insertItem.run(
        stockTakeId, liquor.id, liquor.total_bottles, liquor.opened_bottles,
        actualBottles, actualOpened, variance, isAbnormal ? 1 : 0
      );
    }
    
    db.prepare(`
      UPDATE stock_takes SET
        total_expected = ?, total_actual = ?, total_variance = ?, item_count = ?
      WHERE id = ?
    `).run(totalExpected, totalActual, totalActual - totalExpected, liquors.length, stockTakeId);
    
    return stockTakeId;
  });
  
  try {
    const stockTakeId = transaction();
    const stockTake = db.prepare('SELECT * FROM stock_takes WHERE id = ?').get(stockTakeId);
    res.status(201).json(stockTake);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { items, status } = req.body;
  const stockTakeId = req.params.id;

  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM stock_take_items WHERE stock_take_id = ?').run(stockTakeId);
    
    const insertItem = db.prepare(`
      INSERT INTO stock_take_items (
        stock_take_id, liquor_id, expected_bottles, expected_opened,
        actual_bottles, actual_opened, variance, is_abnormal, variance_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    let totalExpected = 0;
    let totalActual = 0;
    
    for (const item of items) {
      const expectedTotal = item.expected_bottles * 1000 + item.expected_opened;
      const actualTotal = item.actual_bottles * 1000 + item.actual_opened;
      const variance = actualTotal - expectedTotal;
      const isAbnormal = Math.abs(variance) > 1000;
      
      totalExpected += expectedTotal;
      totalActual += actualTotal;
      
      insertItem.run(
        stockTakeId, item.liquor_id, item.expected_bottles, item.expected_opened,
        item.actual_bottles, item.actual_opened, variance, isAbnormal ? 1 : 0,
        item.variance_reason || ''
      );
    }
    
    db.prepare(`
      UPDATE stock_takes SET
        total_expected = ?, total_actual = ?, total_variance = ?,
        status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(totalExpected, totalActual, totalActual - totalExpected, status || 'pending', stockTakeId);
  });
  
  try {
    transaction();
    const stockTake = db.prepare('SELECT * FROM stock_takes WHERE id = ?').get(stockTakeId);
    res.json(stockTake);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/review', (req, res) => {
  const { reviewed_by, comments } = req.body;
  const stockTakeId = req.params.id;

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE stock_takes SET
        status = 'reviewed', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(reviewed_by || 1, stockTakeId);
    
    const items = db.prepare('SELECT * FROM stock_take_items WHERE stock_take_id = ?').all(stockTakeId);
    
    for (const item of items) {
      if (item.variance !== 0) {
        db.prepare(`
          UPDATE liquors SET
            total_bottles = ?,
            opened_bottles = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(item.actual_bottles, item.actual_opened, item.liquor_id);
        
        db.prepare(`
          INSERT INTO stock_transactions (
            liquor_id, transaction_type, quantity, reason, created_by
          ) VALUES (?, ?, ?, ?, ?)
        `).run(
          item.liquor_id,
          item.variance > 0 ? 'stock_in' : 'stock_out',
          Math.abs(item.variance) / 1000,
          '盘点差异调整: ' + (item.variance_reason || comments || ''),
          reviewed_by || 1
        );
      }
    }
  });
  
  try {
    transaction();
    const stockTake = db.prepare('SELECT * FROM stock_takes WHERE id = ?').get(stockTakeId);
    res.json(stockTake);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
