require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { db, initDatabase } = require('./database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.BACKEND_PORT || 58878;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48878}`,
  credentials: true
}));
app.use(express.json());

initDatabase();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (user && bcrypt.compareSync(password, user.password)) {
    res.json({ 
      success: true, 
      user: { id: user.id, username: user.username, role: user.role, name: user.name } 
    });
  } else {
    res.json({ success: false, message: '用户名或密码错误' });
  }
});

app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT id, username, role, name FROM users').all();
  res.json(users);
});

app.get('/api/students', (req, res) => {
  const { grade, class: cls } = req.query;
  let sql = 'SELECT * FROM students WHERE 1=1';
  const params = [];
  
  if (grade) { sql += ' AND grade = ?'; params.push(grade); }
  if (cls) { sql += ' AND class = ?'; params.push(cls); }
  
  const students = db.prepare(sql).all(...params);
  res.json(students);
});

app.post('/api/students', (req, res) => {
  const { student_no, name, grade, class: cls, parent_id } = req.body;
  try {
    const result = db.prepare('INSERT INTO students (student_no, name, grade, class, parent_id) VALUES (?, ?, ?, ?, ?)')
      .run(student_no, name, grade, cls, parent_id || null);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

app.get('/api/fee-items', (req, res) => {
  const { status, grade } = req.query;
  let sql = `
    SELECT fi.*, u.name as creator_name, ur.name as reviewer_name 
    FROM fee_items fi 
    LEFT JOIN users u ON fi.created_by = u.id 
    LEFT JOIN users ur ON fi.reviewed_by = ur.id 
    WHERE 1=1
  `;
  const params = [];
  
  if (status) { sql += ' AND fi.status = ?'; params.push(status); }
  if (grade) { sql += ' AND fi.grade = ?'; params.push(grade); }
  
  sql += ' ORDER BY fi.created_at DESC';
  const items = db.prepare(sql).all(...params);
  res.json(items);
});

app.post('/api/fee-items', (req, res) => {
  const { name, description, amount, grade, class: cls, due_date, created_by } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO fee_items (name, description, amount, grade, class, due_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, description || '', amount, grade, cls || '', due_date, created_by);
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

app.post('/api/fee-items/:id/review', (req, res) => {
  const { id } = req.params;
  const { reviewed_by, status } = req.body;
  
  try {
    db.prepare(`
      UPDATE fee_items 
      SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(status, reviewed_by, id);
    
    if (status === 'published') {
      const feeItem = db.prepare('SELECT * FROM fee_items WHERE id = ?').get(id);
      const students = db.prepare('SELECT * FROM students WHERE grade = ?').all(feeItem.grade);
      
      const insertOrder = db.prepare(`
        INSERT INTO orders (order_no, fee_item_id, student_id, parent_id, original_amount, final_amount, status)
        VALUES (?, ?, ?, ?, ?, ?, 'unpaid')
      `);
      
      for (const student of students) {
        if (student.parent_id) {
          insertOrder.run(
            uuidv4().substring(0, 8).toUpperCase(),
            id,
            student.id,
            student.parent_id,
            feeItem.amount,
            feeItem.amount
          );
        }
      }
    }
    
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

app.get('/api/orders', (req, res) => {
  const { parent_id, student_id, fee_item_id, status } = req.query;
  let sql = `
    SELECT o.*, s.name as student_name, s.grade, s.class, fi.name as fee_item_name
    FROM orders o 
    JOIN students s ON o.student_id = s.id 
    JOIN fee_items fi ON o.fee_item_id = fi.id 
    WHERE 1=1
  `;
  const params = [];
  
  if (parent_id) { sql += ' AND o.parent_id = ?'; params.push(parent_id); }
  if (student_id) { sql += ' AND o.student_id = ?'; params.push(student_id); }
  if (fee_item_id) { sql += ' AND o.fee_item_id = ?'; params.push(fee_item_id); }
  if (status) { sql += ' AND o.status = ?'; params.push(status); }
  
  sql += ' ORDER BY o.created_at DESC';
  const orders = db.prepare(sql).all(...params);
  res.json(orders);
});

app.post('/api/orders/:id/pay', (req, res) => {
  const { id } = req.params;
  const { channel } = req.body;
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) {
    return res.json({ success: false, message: '订单不存在' });
  }
  
  const transactionId = uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase();
  
  db.prepare(`
    INSERT INTO payment_records (order_id, transaction_id, amount, channel, status)
    VALUES (?, ?, ?, ?, 'success')
  `).run(id, transactionId, order.final_amount, channel || 'alipay');
  
  db.prepare(`
    UPDATE orders 
    SET status = 'paid', paid_amount = final_amount, 
        payment_channel = ?, transaction_id = ?, paid_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(channel || 'alipay', transactionId, id);
  
  res.json({ success: true, transactionId });
});

app.get('/api/discounts', (req, res) => {
  const { status, student_id } = req.query;
  let sql = `
    SELECT d.*, s.name as student_name, fi.name as fee_item_name,
           u.name as applicant_name, ur.name as approver_name
    FROM discounts d 
    JOIN students s ON d.student_id = s.id 
    JOIN fee_items fi ON d.fee_item_id = fi.id 
    JOIN users u ON d.applicant_id = u.id 
    LEFT JOIN users ur ON d.approver_id = ur.id 
    WHERE 1=1
  `;
  const params = [];
  
  if (status) { sql += ' AND d.status = ?'; params.push(status); }
  if (student_id) { sql += ' AND d.student_id = ?'; params.push(student_id); }
  
  sql += ' ORDER BY d.created_at DESC';
  const discounts = db.prepare(sql).all(...params);
  res.json(discounts);
});

app.post('/api/discounts', (req, res) => {
  const { fee_item_id, student_id, reason, proof_material, amount, applicant_id } = req.body;
  
  if (!fee_item_id || !student_id || !reason || amount === undefined || amount === null || amount === '') {
    return res.json({ success: false, message: '请填写完整信息' });
  }
  if (parseFloat(amount) <= 0) {
    return res.json({ success: false, message: '减免金额必须大于0' });
  }
  
  try {
    const result = db.prepare(`
      INSERT INTO discounts (fee_item_id, student_id, reason, proof_material, amount, applicant_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(fee_item_id, student_id, reason, proof_material || '', parseFloat(amount), applicant_id);
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

app.post('/api/discounts/:id/approve', (req, res) => {
  const { id } = req.params;
  const { approver_id, status } = req.body;
  
  try {
    db.prepare(`
      UPDATE discounts 
      SET status = ?, approver_id = ?, approved_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(status, approver_id, id);
    
    if (status === 'approved') {
      const discount = db.prepare('SELECT * FROM discounts WHERE id = ?').get(id);
      
      const order = db.prepare(`
        SELECT * FROM orders 
        WHERE fee_item_id = ? AND student_id = ?
      `).get(discount.fee_item_id, discount.student_id);
      
      if (order) {
        const newFinal = Math.max(0, order.original_amount - discount.amount);
        db.prepare(`
          UPDATE orders 
          SET discount_amount = ?, final_amount = ? 
          WHERE id = ?
        `).run(discount.amount, newFinal, order.id);
      }
    }
    
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

app.get('/api/refunds', (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT r.*, o.order_no, s.name as student_name, fi.name as fee_item_name,
           u.name as applicant_name, ur.name as approver_name
    FROM refunds r 
    JOIN orders o ON r.order_id = o.id 
    JOIN students s ON o.student_id = s.id 
    JOIN fee_items fi ON o.fee_item_id = fi.id 
    JOIN users u ON r.applicant_id = u.id 
    LEFT JOIN users ur ON r.approver_id = ur.id 
    WHERE 1=1
  `;
  const params = [];
  
  if (status) { sql += ' AND r.status = ?'; params.push(status); }
  
  sql += ' ORDER BY r.created_at DESC';
  const refunds = db.prepare(sql).all(...params);
  res.json(refunds);
});

app.post('/api/refunds', (req, res) => {
  const { order_id, amount, reason, applicant_id } = req.body;
  
  if (!order_id || !reason || amount === undefined || amount === null || amount === '') {
    return res.json({ success: false, message: '请填写完整信息' });
  }
  if (parseFloat(amount) <= 0) {
    return res.json({ success: false, message: '退款金额必须大于0' });
  }
  
  try {
    const result = db.prepare(`
      INSERT INTO refunds (order_id, amount, reason, applicant_id)
      VALUES (?, ?, ?, ?)
    `).run(order_id, parseFloat(amount), reason, applicant_id);
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

app.post('/api/refunds/:id/approve', (req, res) => {
  const { id } = req.params;
  const { approver_id, status } = req.body;
  
  try {
    db.prepare(`
      UPDATE refunds 
      SET status = ?, approver_id = ?, approved_at = CURRENT_TIMESTAMP,
          transaction_id = ?
      WHERE id = ?
    `).run(status, approver_id, 'REF' + uuidv4().substring(0, 8).toUpperCase(), id);
    
    if (status === 'approved') {
      const refund = db.prepare('SELECT * FROM refunds WHERE id = ?').get(id);
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(refund.order_id);
      
      if (order.paid_amount <= refund.amount) {
        db.prepare('UPDATE orders SET status = "refunded", paid_amount = 0 WHERE id = ?').run(refund.order_id);
      } else {
        db.prepare(`
          UPDATE orders 
          SET status = "partial_refunded", paid_amount = paid_amount - ? 
          WHERE id = ?
        `).run(refund.amount, refund.order_id);
      }
    }
    
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

app.get('/api/reports/summary', (req, res) => {
  const { fee_item_id, grade, class: cls } = req.query;
  
  const feeItems = db.prepare(`
    SELECT fi.id, fi.name, fi.grade, fi.class, fi.amount, fi.status,
           COUNT(o.id) as total_orders,
           SUM(CASE WHEN o.status = 'paid' THEN 1 ELSE 0 END) as paid_count,
           SUM(CASE WHEN o.status = 'unpaid' THEN 1 ELSE 0 END) as unpaid_count,
           SUM(CASE WHEN o.status IN ('refunded', 'partial_refunded') THEN 1 ELSE 0 END) as refund_count,
           SUM(o.final_amount) as total_amount,
           SUM(o.paid_amount) as paid_amount
    FROM fee_items fi
    LEFT JOIN orders o ON fi.id = o.fee_item_id
    WHERE 1=1
    GROUP BY fi.id
    ORDER BY fi.created_at DESC
  `).all();
  
  res.json({ feeItems });
});

app.get('/api/reports/class-summary', (req, res) => {
  const data = db.prepare(`
    SELECT s.grade, s.class, 
           COUNT(DISTINCT s.id) as student_count,
           COUNT(o.id) as total_orders,
           SUM(CASE WHEN o.status = 'paid' THEN 1 ELSE 0 END) as paid_count,
           SUM(CASE WHEN o.status = 'unpaid' THEN 1 ELSE 0 END) as unpaid_count,
           SUM(o.final_amount) as total_amount,
           SUM(o.paid_amount) as paid_amount
    FROM students s
    LEFT JOIN orders o ON s.id = o.student_id
    GROUP BY s.grade, s.class
    ORDER BY s.grade, s.class
  `).all();
  
  res.json(data);
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
