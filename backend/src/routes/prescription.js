const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, status } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = '';
  const params = [];
  
  if (status) {
    whereClause = 'WHERE p.status = ?';
    params.push(status);
  }
  
  const list = db.prepare(`
    SELECT p.*, ip.name as insured_name 
    FROM prescriptions p
    LEFT JOIN insured_persons ip ON p.insured_person_id = ip.id
    ${whereClause}
    ORDER BY p.prescription_date DESC 
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM prescriptions p
    ${whereClause}
  `).get(...params);
  
  res.json({ list, total: total.count, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', (req, res) => {
  const prescription = db.prepare(`
    SELECT p.*, ip.name as insured_name, ip.id_card
    FROM prescriptions p
    LEFT JOIN insured_persons ip ON p.insured_person_id = ip.id
    WHERE p.id = ?
  `).get(req.params.id);
  
  if (!prescription) {
    return res.status(404).json({ error: '处方不存在' });
  }
  
  const items = db.prepare('SELECT * FROM prescription_items WHERE prescription_id = ?').all(req.params.id);
  prescription.items = items;
  
  res.json(prescription);
});

router.post('/', (req, res) => {
  const { insured_person_id, hospital_name, doctor_name, diagnosis, items, total_amount } = req.body;
  
  const id = uuidv4();
  const reimbursement_amount = (total_amount * 0.7).toFixed(2);
  const self_pay_amount = (total_amount - reimbursement_amount).toFixed(2);
  
  const insertPrescription = db.prepare(`
    INSERT INTO prescriptions 
    (id, insured_person_id, hospital_name, doctor_name, diagnosis, total_amount, reimbursement_amount, self_pay_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, '待审核')
  `);
  
  const insertItem = db.prepare(`
    INSERT INTO prescription_items 
    (id, prescription_id, drug_code, drug_name, specification, quantity, unit, unit_price, total_price, dosage)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertMany = db.transaction((prescriptionId, items) => {
    items.forEach(item => {
      insertItem.run(
        uuidv4(),
        prescriptionId,
        item.drug_code,
        item.drug_name,
        item.specification,
        item.quantity,
        item.unit,
        item.unit_price,
        item.total_price,
        item.dosage
      );
    });
  });
  
  try {
    insertPrescription.run(id, insured_person_id, hospital_name, doctor_name, diagnosis, total_amount, reimbursement_amount, self_pay_amount);
    insertMany(id, items);
    
    res.json({ id, ...req.body, reimbursement_amount, self_pay_amount, status: '待审核' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/audit', (req, res) => {
  const { status, auditor } = req.body;
  
  if (!['已审核', '已驳回'].includes(status)) {
    return res.status(400).json({ error: '无效的审核状态' });
  }
  
  db.prepare(`
    UPDATE prescriptions 
    SET status = ?
    WHERE id = ?
  `).run(status, req.params.id);
  
  res.json({ id: req.params.id, status });
});

router.put('/:id/transfer', (req, res) => {
  db.prepare(`
    UPDATE prescriptions 
    SET status = '已流转'
    WHERE id = ? AND status = '已审核'
  `).run(req.params.id);
  
  res.json({ id: req.params.id, status: '已流转' });
});

router.post('/:id/verify', (req, res) => {
  const { pharmacy_id } = req.body;
  
  db.prepare(`
    UPDATE prescriptions 
    SET status = '已核销', pharmacy_id = ?, verification_time = CURRENT_TIMESTAMP
    WHERE id = ? AND status = '已流转'
  `).run(pharmacy_id, req.params.id);
  
  res.json({ id: req.params.id, status: '已核销', verification_time: new Date().toISOString() });
});

module.exports = router;
