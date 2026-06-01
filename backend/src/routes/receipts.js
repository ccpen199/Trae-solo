const express = require('express');
const db = require('../database');
const dayjs = require('dayjs');
const router = express.Router();

router.get('/', (req, res) => {
  const { status, storeId } = req.query;
  let sql = `
    SELECT r.*, o.order_no, s.name as store_name
    FROM receipts r
    JOIN orders o ON r.order_id = o.id
    JOIN stores s ON o.store_id = s.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND r.status = ?';
    params.push(status);
  }
  if (storeId) {
    sql += ' AND o.store_id = ?';
    params.push(storeId);
  }
  
  sql += ' ORDER BY r.created_at DESC';
  
  const receipts = db.prepare(sql).all(...params);
  res.json(receipts);
});

router.get('/:id', (req, res) => {
  const receipt = db.prepare(`
    SELECT r.*, o.order_no, s.name as store_name, o.delivery_date,
           pk.driver, pk.driver_phone, pk.estimated_arrival
    FROM receipts r
    JOIN orders o ON r.order_id = o.id
    JOIN stores s ON o.store_id = s.id
    LEFT JOIN pickings pk ON pk.order_id = o.id
    WHERE r.id = ?
  `).get(req.params.id);
  
  if (!receipt) {
    return res.status(404).json({ error: '收货单不存在' });
  }
  
  const items = db.prepare(`
    SELECT ri.*, p.name as product_name, p.code as product_code, p.spec, p.unit,
           pi.shipped_qty, oi.price
    FROM receipt_items ri
    JOIN products p ON ri.product_id = p.id
    JOIN picking_items pi ON ri.picking_item_id = pi.id
    JOIN order_items oi ON oi.id = pi.order_item_id
    WHERE ri.receipt_id = ?
  `).all(req.params.id);
  
  res.json({ ...receipt, items });
});

router.post('/from-picking/:pickingId', (req, res) => {
  const pickingId = req.params.pickingId;
  
  const picking = db.prepare('SELECT * FROM pickings WHERE id = ?').get(pickingId);
  if (!picking) {
    return res.status(404).json({ error: '拣配单不存在' });
  }
  
  const receiptNo = 'RC' + dayjs().format('YYYYMMDDHHmmss');
  
  const result = db.prepare(`
    INSERT INTO receipts (order_id, receipt_no, status)
    VALUES (?, ?, 'pending')
  `).run(picking.order_id, receiptNo);
  
  const receiptId = result.lastInsertRowid;
  
  const pickingItems = db.prepare('SELECT * FROM picking_items WHERE picking_id = ?').all(pickingId);
  
  const insertItem = db.prepare(`
    INSERT INTO receipt_items (receipt_id, picking_item_id, product_id)
    VALUES (?, ?, ?)
  `);
  
  pickingItems.forEach(item => {
    insertItem.run(receiptId, item.id, item.product_id);
  });
  
  res.json({ id: receiptId, receipt_no: receiptNo });
});

router.patch('/:id', (req, res) => {
  const { items, received_by, remark, status } = req.body;
  
  if (items) {
    const updateItem = db.prepare(`
      UPDATE receipt_items 
      SET received_qty = ?, rejected_qty = ?, reject_reason = ?,
          temperature = ?, is_expiring_soon = ?
      WHERE id = ?
    `);
    
    items.forEach(item => {
      updateItem.run(
        item.received_qty,
        item.rejected_qty,
        item.reject_reason || null,
        item.temperature || null,
        item.is_expiring_soon ? 1 : 0,
        item.id
      );
    });
  }
  
  if (received_by || remark || status) {
    const receivedAt = status === 'completed' ? dayjs().format('YYYY-MM-DD HH:mm:ss') : null;
    
    db.prepare(`
      UPDATE receipts 
      SET received_by = ?, received_at = ?, remark = ?, status = ?
      WHERE id = ?
    `).run(received_by, receivedAt, remark, status, req.params.id);
    
    if (status === 'completed') {
      const receipt = db.prepare('SELECT order_id FROM receipts WHERE id = ?').get(req.params.id);
      db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('received', receipt.order_id);
      
      const receiptItems = db.prepare(`
        SELECT ri.product_id, ri.received_qty, o.store_id
        FROM receipt_items ri
        JOIN receipts r ON ri.receipt_id = r.id
        JOIN orders o ON r.order_id = o.id
        WHERE ri.receipt_id = ?
      `).all(req.params.id);
      
      const updateInventory = db.prepare(`
        UPDATE inventory 
        SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP
        WHERE store_id = ? AND product_id = ?
      `);
      
      receiptItems.forEach(item => {
        updateInventory.run(item.received_qty, item.store_id, item.product_id);
      });
    }
  }
  
  res.json({ id: req.params.id, success: true });
});

module.exports = router;
