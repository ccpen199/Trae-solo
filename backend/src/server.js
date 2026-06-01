require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = process.env.BACKEND_PORT || 58957;

app.use(cors({ origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48957}` }));
app.use(bodyParser.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/merchants', (req, res) => {
  const merchants = db.prepare('SELECT * FROM merchants ORDER BY created_at DESC').all();
  res.json(merchants);
});

app.get('/api/merchants/:id', (req, res) => {
  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.id);
  res.json(merchant || {});
});

app.post('/api/merchants', (req, res) => {
  const { name, stall_number, phone, contact_person, credit_limit } = req.body;
  const result = db.prepare(`
    INSERT INTO merchants (name, stall_number, phone, contact_person, credit_limit)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, stall_number, phone, contact_person, credit_limit || 0);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.put('/api/merchants/:id', (req, res) => {
  const { name, stall_number, phone, contact_person, status, credit_limit } = req.body;
  db.prepare(`
    UPDATE merchants SET name=?, stall_number=?, phone=?, contact_person=?, status=?, credit_limit=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(name, stall_number, phone, contact_person, status, credit_limit, req.params.id);
  res.json({ success: true });
});

app.put('/api/merchants/:id/toggle-status', (req, res) => {
  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.id);
  const newStatus = merchant.status === 'active' ? 'inactive' : 'active';
  db.prepare('UPDATE merchants SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(newStatus, req.params.id);
  res.json({ success: true, status: newStatus });
});

app.get('/api/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories').all();
  res.json(categories);
});

app.get('/api/products', (req, res) => {
  const { merchant_id } = req.query;
  let sql = `
    SELECT p.*, m.name as merchant_name, c.name as category_name
    FROM products p
    LEFT JOIN merchants m ON p.merchant_id = m.id
    LEFT JOIN categories c ON p.category_id = c.id
  `;
  const params = [];
  if (merchant_id) {
    sql += ' WHERE p.merchant_id = ?';
    params.push(merchant_id);
  }
  sql += ' ORDER BY p.created_at DESC';
  const products = db.prepare(sql).all(...params);
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = db.prepare(`
    SELECT p.*, m.name as merchant_name FROM products p
    LEFT JOIN merchants m ON p.merchant_id = m.id
    WHERE p.id = ?
  `).get(req.params.id);
  res.json(product || {});
});

app.post('/api/products', (req, res) => {
  const { merchant_id, category_id, name, specification, grade, unit, price, stock } = req.body;
  const result = db.prepare(`
    INSERT INTO products (merchant_id, category_id, name, specification, grade, unit, price, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(merchant_id, category_id, name, specification, grade, unit, price, stock || 0);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.put('/api/products/:id', (req, res) => {
  const { merchant_id, category_id, name, specification, grade, unit, price, stock, status } = req.body;
  db.prepare(`
    UPDATE products SET merchant_id=?, category_id=?, name=?, specification=?, grade=?, unit=?, price=?, stock=?, status=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(merchant_id, category_id, name, specification, grade, unit, price, stock, status, req.params.id);
  res.json({ success: true });
});

app.put('/api/products/:id/price', (req, res) => {
  const { price } = req.body;
  db.prepare('UPDATE products SET price=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(price, req.params.id);
  res.json({ success: true, price });
});

app.get('/api/customers', (req, res) => {
  const customers = db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all();
  res.json(customers);
});

app.post('/api/customers', (req, res) => {
  const { name, phone, type, credit_limit } = req.body;
  const result = db.prepare(`
    INSERT INTO customers (name, phone, type, credit_limit)
    VALUES (?, ?, ?, ?)
  `).run(name, phone, type || 'retail', credit_limit || 0);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.put('/api/customers/:id', (req, res) => {
  const { name, phone, type, credit_limit } = req.body;
  db.prepare(`
    UPDATE customers SET name=?, phone=?, type=?, credit_limit=?
    WHERE id=?
  `).run(name, phone, type, credit_limit, req.params.id);
  res.json({ success: true });
});

function generateOrderNo() {
  const date = new Date();
  const prefix = 'ORD' + date.getFullYear().toString().slice(-2) + 
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');
  const last = db.prepare("SELECT order_no FROM orders WHERE order_no LIKE ? ORDER BY id DESC LIMIT 1").get(prefix + '%');
  let seq = 1;
  if (last) {
    seq = parseInt(last.order_no.slice(-4)) + 1;
  }
  return prefix + seq.toString().padStart(4, '0');
}

app.post('/api/orders', (req, res) => {
  const { customer_id, merchant_id, type, items, remark, is_credit } = req.body;
  
  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(merchant_id);
  if (merchant && merchant.status !== 'active') {
    return res.status(400).json({ error: '商户已停业，无法接单' });
  }

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
  let total_amount = 0;
  items.forEach(item => {
    const price = item.negotiated_price || item.quoted_price;
    total_amount += price * (item.booked_quantity || 0);
  });

  if (is_credit && customer) {
    const new_debt = customer.current_debt + total_amount;
    if (new_debt > customer.credit_limit) {
      return res.status(400).json({ error: '超出信用额度，无法赊账', current_debt: customer.current_debt, credit_limit: customer.credit_limit });
    }
  }

  const order_no = generateOrderNo();
  const service_fee = total_amount * 0.01;

  const result = db.prepare(`
    INSERT INTO orders (order_no, customer_id, merchant_id, type, total_amount, actual_amount, is_credit, credit_amount, service_fee, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(order_no, customer_id, merchant_id, type || 'spot', total_amount, total_amount, is_credit ? 1 : 0, is_credit ? total_amount : 0, service_fee, remark);

  const orderId = result.lastInsertRowid;
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, specification, grade, unit, quoted_price, negotiated_price, booked_quantity, unit_price, amount, actual_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  items.forEach(item => {
    const price = item.negotiated_price || item.quoted_price;
    const amount = price * (item.booked_quantity || 0);
    insertItem.run(orderId, item.product_id, item.product_name, item.specification, item.grade, item.unit, item.quoted_price, item.negotiated_price, item.booked_quantity, price, amount, amount);
  });

  db.prepare('INSERT INTO transaction_logs (type, order_id, merchant_id, customer_id, amount, operator, remark) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run('order_create', orderId, merchant_id, customer_id, total_amount, 'system', '创建订单');

  res.json({ id: orderId, order_no, total_amount });
});

app.get('/api/orders', (req, res) => {
  const { status, merchant_id, customer_id } = req.query;
  let sql = `
    SELECT o.*, m.name as merchant_name, c.name as customer_name
    FROM orders o
    LEFT JOIN merchants m ON o.merchant_id = m.id
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND o.status = ?'; params.push(status); }
  if (merchant_id) { sql += ' AND o.merchant_id = ?'; params.push(merchant_id); }
  if (customer_id) { sql += ' AND o.customer_id = ?'; params.push(customer_id); }
  sql += ' ORDER BY o.created_at DESC LIMIT 100';
  const orders = db.prepare(sql).all(...params);
  res.json(orders);
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*, m.name as merchant_name, c.name as customer_name
    FROM orders o
    LEFT JOIN merchants m ON o.merchant_id = m.id
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.id = ?
  `).get(req.params.id);
  
  if (order) {
    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.id);
  }
  res.json(order || {});
});

app.post('/api/orders/:id/weigh', (req, res) => {
  const { item_id, weight, operator } = req.body;
  
  const item = db.prepare('SELECT * FROM order_items WHERE id = ? AND order_id = ?').get(item_id, req.params.id);
  if (!item) {
    return res.status(404).json({ error: '订单项不存在' });
  }

  db.prepare('INSERT INTO weighings (order_item_id, weight, operator) VALUES (?, ?, ?)')
    .run(item_id, weight, operator);

  const actual_amount = item.unit_price * weight;
  db.prepare('UPDATE order_items SET weighed_quantity = ?, actual_amount = ? WHERE id = ?')
    .run(weight, actual_amount, item_id);

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.id);
  const total_actual = items.reduce((sum, i) => sum + (i.actual_amount || i.amount), 0);
  const service_fee = total_actual * 0.01;
  
  db.prepare('UPDATE orders SET actual_amount = ?, service_fee = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(total_actual, service_fee, req.params.id);

  res.json({ success: true, actual_amount });
});

app.post('/api/orders/:id/settle', (req, res) => {
  const { payment_method, amount, transaction_no, operator } = req.body;
  const orderId = req.params.id;
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  const settleAmount = parseFloat(amount) || order.actual_amount;

  db.prepare(`
    INSERT INTO settlements (order_id, amount, payment_method, transaction_no, operator)
    VALUES (?, ?, ?, ?, ?)
  `).run(orderId, settleAmount, payment_method, transaction_no, operator);

  const newPaid = order.paid_amount + settleAmount;
  const newCredit = Math.max(0, order.credit_amount - settleAmount);
  const status = newPaid >= order.actual_amount ? 'completed' : 'partial';

  db.prepare(`
    UPDATE orders SET paid_amount = ?, credit_amount = ?, payment_method = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newPaid, newCredit, payment_method, status, orderId);

  if (order.is_credit) {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(order.customer_id);
    if (customer) {
      db.prepare('UPDATE customers SET current_debt = current_debt - ? WHERE id = ?').run(settleAmount, order.customer_id);
    }
  }

  db.prepare('INSERT INTO transaction_logs (type, order_id, merchant_id, customer_id, amount, operator, remark) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run('payment', orderId, order.merchant_id, order.customer_id, settleAmount, operator, '订单结算');

  res.json({ success: true, paid_amount: newPaid, status });
});

app.post('/api/orders/:id/invoice', (req, res) => {
  const orderId = req.params.id;
  const { amount, type, title, tax_no, address, phone, bank, account } = req.body;
  
  const invoiceNo = 'INV' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  db.prepare(`
    INSERT INTO invoices (order_id, invoice_no, amount, type, status, title, tax_no, address, phone, bank, account)
    VALUES (?, ?, ?, ?, 'issued', ?, ?, ?, ?, ?, ?)
  `).run(orderId, invoiceNo, amount, type, title, tax_no, address, phone, bank, account);

  res.json({ success: true, invoice_no: invoiceNo });
});

app.get('/api/orders/:id/invoices', (req, res) => {
  const invoices = db.prepare('SELECT * FROM invoices WHERE order_id = ?').all(req.params.id);
  res.json(invoices);
});

app.post('/api/disputes', (req, res) => {
  const { order_id, type, description, evidence_images } = req.body;
  
  const result = db.prepare(`
    INSERT INTO disputes (order_id, type, description, evidence_images)
    VALUES (?, ?, ?, ?)
  `).run(order_id, type, description, evidence_images);

  res.json({ id: result.lastInsertRowid });
});

app.get('/api/disputes', (req, res) => {
  const disputes = db.prepare(`
    SELECT d.*, o.order_no
    FROM disputes d
    LEFT JOIN orders o ON d.order_id = o.id
    ORDER BY d.created_at DESC
  `).all();
  res.json(disputes);
});

app.put('/api/disputes/:id', (req, res) => {
  const { status, result, responsible_party, refund_amount, handler } = req.body;
  const disputeId = req.params.id;

  const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeId);
  
  db.prepare(`
    UPDATE disputes SET status=?, result=?, responsible_party=?, refund_amount=?, handler=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(status, result, responsible_party, refund_amount, handler, disputeId);

  if (status === 'resolved' && refund_amount > 0) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(dispute.order_id);
    if (order) {
      const newRefund = order.refund_amount + parseFloat(refund_amount);
      db.prepare('UPDATE orders SET refund_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(newRefund, dispute.order_id);
      
      db.prepare('INSERT INTO transaction_logs (type, order_id, merchant_id, customer_id, amount, operator, remark) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run('refund', dispute.order_id, order.merchant_id, order.customer_id, refund_amount, handler, result);
    }
  }

  res.json({ success: true });
});

app.get('/api/transaction-logs', (req, res) => {
  const logs = db.prepare('SELECT * FROM transaction_logs ORDER BY created_at DESC LIMIT 200').all();
  res.json(logs);
});

app.get('/api/stats/dashboard', (req, res) => {
  const todayOrders = db.prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(actual_amount), 0) as amount FROM orders WHERE DATE(created_at) = DATE('now')").get();
  const pendingOrders = db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE status = 'pending'").get();
  const totalMerchants = db.prepare("SELECT COUNT(*) as cnt FROM merchants WHERE status = 'active'").get();
  const totalProducts = db.prepare("SELECT COUNT(*) as cnt FROM products WHERE status = 'active'").get();
  
  res.json({
    today_orders: todayOrders.cnt,
    today_amount: todayOrders.amount,
    pending_orders: pendingOrders.cnt,
    active_merchants: totalMerchants.cnt,
    active_products: totalProducts.cnt
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
