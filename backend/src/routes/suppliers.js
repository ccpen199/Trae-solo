import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { industry, region, risk_level, is_key_supplier, search } = req.query;
  
  let query = 'SELECT * FROM suppliers WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR contact_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (industry) {
    query += ' AND industry = ?';
    params.push(industry);
  }
  if (region) {
    query += ' AND region = ?';
    params.push(region);
  }
  if (risk_level) {
    query += ' AND risk_level = ?';
    params.push(risk_level);
  }
  if (is_key_supplier) {
    query += ' AND is_key_supplier = ?';
    params.push(is_key_supplier === 'true' ? 1 : 0);
  }

  query += ' ORDER BY is_key_supplier DESC, contract_amount DESC';

  const suppliers = db.prepare(query).all(...params);
  res.json(suppliers);
});

router.get('/:id', (req, res) => {
  const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);
  if (!supplier) {
    return res.status(404).json({ error: '供应商不存在' });
  }
  res.json(supplier);
});

router.post('/', (req, res) => {
  const { name, industry, region, product_category, contract_amount, risk_level, is_key_supplier, contact_name, contact_email, contact_phone } = req.body;

  const result = db.prepare(`
    INSERT INTO suppliers (name, industry, region, product_category, contract_amount, risk_level, is_key_supplier, contact_name, contact_email, contact_phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, industry, region, product_category, contract_amount, risk_level || 'medium', is_key_supplier ? 1 : 0, contact_name, contact_email, contact_phone);

  const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(supplier);
});

router.put('/:id', (req, res) => {
  const { name, industry, region, product_category, contract_amount, risk_level, is_key_supplier, contact_name, contact_email, contact_phone, status } = req.body;

  db.prepare(`
    UPDATE suppliers SET
      name = ?, industry = ?, region = ?, product_category = ?,
      contract_amount = ?, risk_level = ?, is_key_supplier = ?,
      contact_name = ?, contact_email = ?, contact_phone = ?, status = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, industry, region, product_category, contract_amount, risk_level, is_key_supplier ? 1 : 0, contact_name, contact_email, contact_phone, status || 'active', req.params.id);

  const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);
  res.json(supplier);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM suppliers WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

router.get('/:id/assessments', (req, res) => {
  const assessments = db.prepare(`
    SELECT a.*, q.name as questionnaire_name, q.version as questionnaire_version
    FROM assessments a
    JOIN questionnaires q ON a.questionnaire_id = q.id
    WHERE a.supplier_id = ?
    ORDER BY a.created_at DESC
  `).all(req.params.id);
  res.json(assessments);
});

export default router;
