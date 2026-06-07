const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, keyword = '' } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = '';
  const params = [];
  
  if (keyword) {
    whereClause = 'WHERE name LIKE ? OR id_card LIKE ? OR medical_card_number LIKE ?';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  
  const list = db.prepare(`
    SELECT * FROM insured_persons 
    ${whereClause}
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM insured_persons 
    ${whereClause}
  `).get(...params);
  
  res.json({ list, total: total.count, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', (req, res) => {
  const person = db.prepare('SELECT * FROM insured_persons WHERE id = ?').get(req.params.id);
  if (!person) {
    return res.status(404).json({ error: '参保人不存在' });
  }
  res.json(person);
});

router.post('/', (req, res) => {
  const { id_card, name, gender, birth_date, phone, address, insurance_type, insurance_area, insured_date, balance } = req.body;
  
  const id = uuidv4();
  const medical_card_number = 'YBK' + Date.now().toString().slice(-10);
  
  try {
    db.prepare(`
      INSERT INTO insured_persons 
      (id, id_card, name, gender, birth_date, phone, address, insurance_type, insurance_area, insured_date, medical_card_number, balance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, id_card, name, gender, birth_date, phone, address, insurance_type, insurance_area, insured_date, medical_card_number, balance || 0);
    
    res.json({ id, medical_card_number, ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, gender, birth_date, phone, address, insurance_type, insurance_area, status, balance } = req.body;
  
  db.prepare(`
    UPDATE insured_persons 
    SET name = ?, gender = ?, birth_date = ?, phone = ?, address = ?, insurance_type = ?, insurance_area = ?, status = ?, balance = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, gender, birth_date, phone, address, insurance_type, insurance_area, status, balance, req.params.id);
  
  res.json({ id: req.params.id, ...req.body });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM insured_persons WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/:id/statistics', (req, res) => {
  const id = req.params.id;
  
  const totalSettlements = db.prepare('SELECT COUNT(*) as count, SUM(total_amount) as amount FROM settlement_records WHERE insured_person_id = ?').get(id);
  const totalPrescriptions = db.prepare('SELECT COUNT(*) as count FROM prescriptions WHERE insured_person_id = ?').get(id);
  const balance = db.prepare('SELECT balance FROM insured_persons WHERE id = ?').get(id);
  
  res.json({
    totalSettlements: totalSettlements.count || 0,
    totalSettlementAmount: totalSettlements.amount || 0,
    totalPrescriptions: totalPrescriptions.count || 0,
    accountBalance: balance?.balance || 0
  });
});

module.exports = router;
