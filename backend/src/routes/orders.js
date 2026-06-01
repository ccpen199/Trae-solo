const express = require('express');
const db = require('../database');
const dayjs = require('dayjs');
const router = express.Router();

router.get('/suggestion/:storeId', (req, res) => {
  const storeId = req.params.storeId;
  const { deliveryDate } = req.query;
  
  const avgSales = db.prepare(`
    SELECT product_id, AVG(quantity) as avg_qty
    FROM sales_history
    WHERE store_id = ? AND sale_date >= DATE('now', '-7 days')
    GROUP BY product_id
  `).all(storeId);
  
  const inventory = db.prepare(`
    SELECT product_id, quantity, safety_stock
    FROM inventory
    WHERE store_id = ?
  `).all(storeId);
  
  const products = db.prepare(`
    SELECT id, code, name, spec, unit, price, min_order_qty, category
    FROM products
    WHERE status = 'active'
  `).all();
  
  const suggestions = products.map(product => {
    const sale = avgSales.find(s => s.product_id === product.id);
    const inv = inventory.find(i => i.product_id === product.id);
    const avgQty = sale ? sale.avg_qty : 0;
    const stockQty = inv ? inv.quantity : 0;
    const safetyStock = inv ? inv.safety_stock : 10;
    
    let suggestedQty = Math.ceil((avgQty * 2 + safetyStock - stockQty) / product.min_order_qty) * product.min_order_qty;
    suggestedQty = Math.max(suggestedQty, product.min_order_qty);
    
    return {
      product_id: product.id,
      product_code: product.code,
      product_name: product.name,
      spec: product.spec,
      unit: product.unit,
      category: product.category,
      price: product.price,
      min_order_qty: product.min_order_qty,
      current_stock: stockQty,
      avg_sales: avgQty.toFixed(1),
      safety_stock: safetyStock,
      suggested_qty: suggestedQty
    };
  });
  
  res.json(suggestions);
});

router.get('/', (req, res) => {
  const { storeId, status } = req.query;
  let sql = `
    SELECT o.*, s.name as store_name,
           (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
    FROM orders o
    JOIN stores s ON o.store_id = s.id
    WHERE 1=1
  `;
  const params = [];
  
  if (storeId) {
    sql += ' AND o.store_id = ?';
    params.push(storeId);
  }
  if (status) {
    sql += ' AND o.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY o.created_at DESC';
  
  const orders = db.prepare(sql).all(...params);
  res.json(orders);
});

router.get('/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*, s.name as store_name
    FROM orders o
    JOIN stores s ON o.store_id = s.id
    WHERE o.id = ?
  `).get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  const items = db.prepare(`
    SELECT oi.*, p.name as product_name, p.code as product_code, p.spec, p.unit
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(req.params.id);
  
  res.json({ ...order, items });
});

router.post('/', (req, res) => {
  const { store_id, delivery_date, items, remark, created_by } = req.body;
  
  const orderNo = 'PO' + dayjs().format('YYYYMMDDHHmmss');
  const orderDate = dayjs().format('YYYY-MM-DD');
  
  let totalAmount = 0;
  items.forEach(item => {
    totalAmount += item.ordered_qty * item.price;
  });
  
  const insertOrder = db.prepare(`
    INSERT INTO orders (order_no, store_id, order_date, delivery_date, total_amount, remark, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = insertOrder.run(orderNo, store_id, orderDate, delivery_date, totalAmount, remark, created_by);
  const orderId = result.lastInsertRowid;
  
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, suggested_qty, ordered_qty, adjust_reason, price, amount)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  items.forEach(item => {
    insertItem.run(
      orderId,
      item.product_id,
      item.suggested_qty,
      item.ordered_qty,
      item.adjust_reason || null,
      item.price,
      item.ordered_qty * item.price
    );
  });
  
  res.json({ id: orderId, order_no: orderNo, total_amount: totalAmount });
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  res.json({ id: req.params.id, status });
});

module.exports = router;
