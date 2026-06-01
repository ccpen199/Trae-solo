const express = require('express');
const db = require('../database');
const dayjs = require('dayjs');
const router = express.Router();

router.get('/', (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT p.*, o.order_no, s.name as store_name
    FROM pickings p
    JOIN orders o ON p.order_id = o.id
    JOIN stores s ON o.store_id = s.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND p.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY p.created_at DESC';
  
  const pickings = db.prepare(sql).all(...params);
  res.json(pickings);
});

router.get('/:id', (req, res) => {
  const picking = db.prepare(`
    SELECT p.*, o.order_no, s.name as store_name, o.delivery_date
    FROM pickings p
    JOIN orders o ON p.order_id = o.id
    JOIN stores s ON o.store_id = s.id
    WHERE p.id = ?
  `).get(req.params.id);
  
  if (!picking) {
    return res.status(404).json({ error: '拣配单不存在' });
  }
  
  const items = db.prepare(`
    SELECT pi.*, p.name as product_name, p.code as product_code, p.spec, p.unit,
           oi.ordered_qty, sp.name as substitute_name
    FROM picking_items pi
    JOIN products p ON pi.product_id = p.id
    JOIN order_items oi ON pi.order_item_id = oi.id
    LEFT JOIN products sp ON pi.substitute_product_id = sp.id
    WHERE pi.picking_id = ?
  `).all(req.params.id);
  
  res.json({ ...picking, items });
});

router.post('/from-order/:orderId', (req, res) => {
  const orderId = req.params.orderId;
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  const pickingNo = 'PK' + dayjs().format('YYYYMMDDHHmmss');
  
  const result = db.prepare(`
    INSERT INTO pickings (order_id, picking_no, status)
    VALUES (?, ?, 'pending')
  `).run(orderId, pickingNo);
  
  const pickingId = result.lastInsertRowid;
  
  const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  
  const insertItem = db.prepare(`
    INSERT INTO picking_items (picking_id, order_item_id, product_id)
    VALUES (?, ?, ?)
  `);
  
  orderItems.forEach(item => {
    insertItem.run(pickingId, item.id, item.product_id);
  });
  
  db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('picking', orderId);
  
  res.json({ id: pickingId, picking_no: pickingNo });
});

router.patch('/:id', (req, res) => {
  const { items, driver, driver_phone, estimated_arrival, status } = req.body;
  
  if (items) {
    const updateItem = db.prepare(`
      UPDATE picking_items 
      SET picked_qty = ?, shipped_qty = ?, shortage_qty = ?, 
          substitute_product_id = ?, shortage_reason = ?
      WHERE id = ?
    `);
    
    items.forEach(item => {
      updateItem.run(
        item.picked_qty,
        item.shipped_qty,
        item.shortage_qty,
        item.substitute_product_id || null,
        item.shortage_reason || null,
        item.id
      );
    });
  }
  
  if (driver || driver_phone || estimated_arrival || status) {
    db.prepare(`
      UPDATE pickings 
      SET driver = ?, driver_phone = ?, estimated_arrival = ?, status = ?
      WHERE id = ?
    `).run(driver, driver_phone, estimated_arrival, status, req.params.id);
    
    if (status === 'shipped') {
      const picking = db.prepare('SELECT order_id FROM pickings WHERE id = ?').get(req.params.id);
      db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('shipped', picking.order_id);
    }
  }
  
  res.json({ id: req.params.id, success: true });
});

module.exports = router;
