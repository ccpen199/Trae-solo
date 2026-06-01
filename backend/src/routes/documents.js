import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/customer/:customerId', (req, res) => {
  const documents = db.prepare(`
    SELECT d.*, u.name as uploader_name, r.name as reviewer_name
    FROM documents d
    LEFT JOIN users u ON d.uploaded_by = u.id
    LEFT JOIN users r ON d.reviewed_by = r.id
    WHERE d.customer_id = ?
    ORDER BY d.created_at DESC
  `).all(req.params.customerId);
  res.json(documents);
});

router.put('/:id', (req, res) => {
  const { status, reviewed_by, reject_reason, uploaded_by } = req.body;
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  
  if (!doc) {
    return res.status(404).json({ error: '文档不存在' });
  }

  try {
    const newVersion = status === 'resubmitted' ? doc.version + 1 : doc.version;
    
    db.prepare(`
      UPDATE documents 
      SET status = ?, reviewed_by = ?, reject_reason = ?, uploaded_by = ?, version = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, reviewed_by, reject_reason, uploaded_by || doc.uploaded_by, newVersion, req.params.id);

    if (status === 'rejected' && doc.uploaded_by) {
      db.prepare(`
        INSERT INTO todos (user_id, customer_id, type, title, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(doc.uploaded_by, doc.customer_id, 'correction', `资料需要补正: ${doc.name}`, reject_reason);
    }

    if (status === 'approved') {
      const pendingDocs = db.prepare(`
        SELECT COUNT(*) as count FROM documents WHERE customer_id = ? AND status != 'approved'
      `).get(doc.customer_id);
      
      if (pendingDocs.count === 0) {
        const reviewers = db.prepare('SELECT id FROM users WHERE role = ?').all('reviewer');
        const customer = db.prepare('SELECT name FROM customers WHERE id = ?').get(doc.customer_id);
        const insertTodo = db.prepare('INSERT INTO todos (user_id, customer_id, type, title) VALUES (?, ?, ?, ?)');
        reviewers.forEach(r => {
          insertTodo.run(r.id, doc.customer_id, 'approval', `客户 ${customer.name} 资料已齐全，请审批`);
        });
      }
    }

    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
