import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/customer/:customerId', (req, res) => {
  const records = db.prepare(`
    SELECT a.*, u.name as operator_name
    FROM approval_records a
    LEFT JOIN users u ON a.operator_id = u.id
    WHERE a.customer_id = ?
    ORDER BY a.created_at DESC
  `).all(req.params.customerId);
  res.json(records);
});

router.post('/customer/:customerId', (req, res) => {
  const { node, operator_id, opinion, risk_tips, amount_suggestion, result } = req.body;
  const customerId = req.params.customerId;

  try {
    const creditAuths = db.prepare(`
      SELECT * FROM credit_authorizations 
      WHERE customer_id = ? AND status = 'success'
    `).all(customerId);
    
    const now = new Date();
    const validAuth = creditAuths.find(auth => {
      if (!auth.expire_time) return false;
      return new Date(auth.expire_time) > now;
    });

    if (!validAuth) {
      return res.status(400).json({ error: '征信授权已过期或未完成，无法提交审批' });
    }

    const maxVersion = db.prepare(`
      SELECT MAX(version) as max_v FROM approval_records WHERE customer_id = ?
    `).get(customerId);
    const version = (maxVersion.max_v || 0) + 1;

    const insertResult = db.prepare(`
      INSERT INTO approval_records (customer_id, node, version, operator_id, opinion, risk_tips, amount_suggestion, result)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(customerId, node, version, operator_id, opinion, risk_tips, amount_suggestion, result);

    let customerStatus = 'reviewing';
    if (result === 'approved') {
      if (node === 'final') {
        customerStatus = 'approved';
      }
    } else if (result === 'rejected') {
      customerStatus = 'rejected';
    }

    db.prepare('UPDATE customers SET status = ? WHERE id = ?').run(customerStatus, customerId);

    if (result === 'approved' && node === 'review') {
      const directors = db.prepare('SELECT id FROM users WHERE role = ?').all('director');
      const customer = db.prepare('SELECT name FROM customers WHERE id = ?').get(customerId);
      const insertTodo = db.prepare('INSERT INTO todos (user_id, customer_id, type, title) VALUES (?, ?, ?, ?)');
      directors.forEach(d => {
        insertTodo.run(d.id, customerId, 'approval', `客户 ${customer.name} 初审通过，请终审`);
      });
    }

    if (result === 'rejected') {
      const customer = db.prepare('SELECT name, created_by FROM customers WHERE id = ?').get(customerId);
      db.prepare('INSERT INTO todos (user_id, customer_id, type, title, description) VALUES (?, ?, ?, ?, ?)')
        .run(customer.created_by, customerId, 'correction', `客户 ${customer.name} 审批被退回`, opinion);
    }

    res.json({ id: insertResult.lastInsertRowid, message: '审批记录创建成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
