import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const customers = db.prepare(`
    SELECT c.*, p.name as product_name, u.name as creator_name
    FROM customers c
    LEFT JOIN loan_products p ON c.loan_product_id = p.id
    LEFT JOIN users u ON c.created_by = u.id
    ORDER BY c.created_at DESC
  `).all();
  res.json(customers);
});

router.get('/:id', (req, res) => {
  const customer = db.prepare(`
    SELECT c.*, p.name as product_name, p.document_types, u.name as creator_name
    FROM customers c
    LEFT JOIN loan_products p ON c.loan_product_id = p.id
    LEFT JOIN users u ON c.created_by = u.id
    WHERE c.id = ?
  `).get(req.params.id);
  
  if (!customer) {
    return res.status(404).json({ error: '客户不存在' });
  }

  const coBorrowers = db.prepare('SELECT * FROM co_borrowers WHERE customer_id = ?').all(req.params.id);
  const documents = db.prepare(`
    SELECT d.*, u.name as uploader_name, r.name as reviewer_name
    FROM documents d
    LEFT JOIN users u ON d.uploaded_by = u.id
    LEFT JOIN users r ON d.reviewed_by = r.id
    WHERE d.customer_id = ?
    ORDER BY d.created_at DESC
  `).all(req.params.id);
  const creditAuths = db.prepare('SELECT * FROM credit_authorizations WHERE customer_id = ?').all(req.params.id);
  const approvals = db.prepare(`
    SELECT a.*, u.name as operator_name
    FROM approval_records a
    LEFT JOIN users u ON a.operator_id = u.id
    WHERE a.customer_id = ?
    ORDER BY a.created_at DESC
  `).all(req.params.id);

  res.json({ ...customer, coBorrowers, documents, creditAuths, approvals });
});

router.post('/', (req, res) => {
  const { name, id_card, phone, email, marital_status, address, loan_product_id, loan_amount, created_by } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO customers (name, id_card, phone, email, marital_status, address, loan_product_id, loan_amount, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, id_card, phone, email, marital_status, address, loan_product_id, loan_amount, created_by);

    const product = db.prepare('SELECT document_types FROM loan_products WHERE id = ?').get(loan_product_id);
    if (product) {
      const docTypes = JSON.parse(product.document_types);
      const docNames = {
        'purchase_contract': '购房合同',
        'income_flow': '收入流水',
        'credit_auth': '征信授权书',
        'marriage_cert': '婚姻证明',
        'down_payment': '首付款凭证',
        'co_borrower': '共同借款人资料'
      };
      
      const insertDoc = db.prepare('INSERT INTO documents (customer_id, type, name) VALUES (?, ?, ?)');
      docTypes.forEach(type => {
        insertDoc.run(result.lastInsertRowid, type, docNames[type] || type);
      });
    }

    const todos = db.prepare('SELECT id FROM users WHERE role IN (?, ?)').all('specialist', 'manager');
    const insertTodo = db.prepare('INSERT INTO todos (user_id, customer_id, type, title) VALUES (?, ?, ?, ?)');
    todos.forEach(t => {
      insertTodo.run(t.id, result.lastInsertRowid, 'document', `新客户 ${name} 需要收集资料`);
    });

    res.json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, id_card, phone, email, marital_status, address, loan_product_id, loan_amount, status } = req.body;
  
  try {
    db.prepare(`
      UPDATE customers 
      SET name = ?, id_card = ?, phone = ?, email = ?, marital_status = ?, address = ?, 
          loan_product_id = ?, loan_amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, id_card, phone, email, marital_status, address, loan_product_id, loan_amount, status, req.params.id);
    
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/co-borrowers', (req, res) => {
  const { name, id_card, phone, relationship } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO co_borrowers (customer_id, name, id_card, phone, relationship)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.params.id, name, id_card, phone, relationship);
    res.json({ id: result.lastInsertRowid, message: '添加成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
