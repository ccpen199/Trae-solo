import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/users', (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.json(users);
});

router.get('/products', (req, res) => {
  const products = db.prepare('SELECT * FROM loan_products').all();
  res.json(products.map(p => ({ ...p, document_types: JSON.parse(p.document_types) })));
});

router.get('/todos/:userId', (req, res) => {
  const todos = db.prepare(`
    SELECT t.*, c.name as customer_name
    FROM todos t
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE t.user_id = ? AND t.status = 'pending'
    ORDER BY t.created_at DESC
  `).all(req.params.userId);
  res.json(todos);
});

router.put('/todos/:id', (req, res) => {
  const { status } = req.body;
  try {
    db.prepare('UPDATE todos SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/stats', (req, res) => {
  const userId = req.query.userId;
  const role = req.query.role;
  
  let totalCustomers, pendingDocs, pendingApprovals, approvedCount;
  
  if (role === 'manager') {
    totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers WHERE created_by = ?').get(userId);
    pendingDocs = db.prepare("SELECT COUNT(*) as count FROM documents d JOIN customers c ON d.customer_id = c.id WHERE c.created_by = ? AND d.status = 'submitted'").get(userId);
    pendingApprovals = db.prepare("SELECT COUNT(*) as count FROM approval_records a JOIN customers c ON a.customer_id = c.id WHERE c.created_by = ? AND a.result = 'pending'").get(userId);
    approvedCount = db.prepare("SELECT COUNT(*) as count FROM customers WHERE created_by = ? AND status = 'approved'").get(userId);
  } else if (role === 'specialist') {
    totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get();
    pendingDocs = db.prepare("SELECT COUNT(*) as count FROM documents WHERE status = 'submitted'").get();
    pendingApprovals = db.prepare("SELECT COUNT(*) as count FROM approval_records WHERE result = 'pending'").get(userId);
    approvedCount = db.prepare("SELECT COUNT(*) as count FROM customers WHERE status = 'approved'").get();
  } else if (role === 'reviewer') {
    totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get();
    pendingDocs = db.prepare("SELECT COUNT(*) as count FROM documents WHERE status = 'submitted'").get();
    pendingApprovals = db.prepare("SELECT COUNT(*) as count FROM approval_records WHERE node = 'review' AND result = 'pending'").get();
    approvedCount = db.prepare("SELECT COUNT(*) as count FROM customers WHERE status = 'approved'").get();
  } else if (role === 'director') {
    totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get();
    pendingDocs = db.prepare("SELECT COUNT(*) as count FROM documents WHERE status = 'submitted'").get();
    pendingApprovals = db.prepare("SELECT COUNT(*) as count FROM approval_records WHERE node = 'final' AND result = 'pending'").get();
    approvedCount = db.prepare("SELECT COUNT(*) as count FROM customers WHERE status = 'approved'").get();
  } else {
    totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get();
    pendingDocs = db.prepare("SELECT COUNT(*) as count FROM documents WHERE status = 'submitted'").get();
    pendingApprovals = db.prepare("SELECT COUNT(*) as count FROM approval_records WHERE result = 'pending'").get();
    approvedCount = db.prepare("SELECT COUNT(*) as count FROM customers WHERE status = 'approved'").get();
  }
  
  res.json({
    totalCustomers: totalCustomers.count,
    pendingDocs: pendingDocs.count,
    pendingApprovals: pendingApprovals.count,
    approvedCount: approvedCount.count
  });
});

export default router;
