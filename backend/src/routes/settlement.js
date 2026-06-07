const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, settlement_type, is_cross_province } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (settlement_type) {
    whereClause += ' AND settlement_type = ?';
    params.push(settlement_type);
  }
  
  if (is_cross_province !== undefined) {
    whereClause += ' AND is_cross_province = ?';
    params.push(is_cross_province);
  }
  
  const list = db.prepare(`
    SELECT s.*, ip.name as insured_name 
    FROM settlement_records s
    LEFT JOIN insured_persons ip ON s.insured_person_id = ip.id
    ${whereClause}
    ORDER BY s.settlement_date DESC 
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM settlement_records s
    ${whereClause}
  `).get(...params);
  
  res.json({ list, total: total.count, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/statistics/summary', (req, res) => {
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_settlements,
      SUM(total_amount) as total_amount,
      SUM(insurance_pay) as total_insurance_pay,
      SUM(CASE WHEN is_cross_province = 1 THEN 1 ELSE 0 END) as cross_province_count
    FROM settlement_records
  `).get();
  
  res.json(stats);
});

router.get('/:id', (req, res) => {
  const settlement = db.prepare(`
    SELECT s.*, ip.name as insured_name, ip.id_card
    FROM settlement_records s
    LEFT JOIN insured_persons ip ON s.insured_person_id = ip.id
    WHERE s.id = ?
  `).get(req.params.id);
  
  if (!settlement) {
    return res.status(404).json({ error: '结算记录不存在' });
  }
  res.json(settlement);
});

router.post('/', (req, res) => {
  const { insured_person_id, offsite_record_id, settlement_type, hospital_name, total_amount, province_code, is_cross_province } = req.body;
  
  const id = uuidv4();
  const insurance_pay = (total_amount * 0.7).toFixed(2);
  const individual_pay = (total_amount * 0.2).toFixed(2);
  const account_pay = (total_amount * 0.1).toFixed(2);
  
  db.prepare(`
    INSERT INTO settlement_records 
    (id, insured_person_id, offsite_record_id, settlement_type, hospital_name, total_amount, insurance_pay, individual_pay, account_pay, province_code, is_cross_province)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, insured_person_id, offsite_record_id, settlement_type, hospital_name, total_amount, insurance_pay, individual_pay, account_pay, province_code, is_cross_province ? 1 : 0);
  
  res.json({ id, ...req.body, insurance_pay, individual_pay, account_pay });
});

router.post('/cross-province-settlement', (req, res) => {
  const { insured_person_id, offsite_record_id, settlement_type, hospital_name, total_amount, from_province, to_province } = req.body;
  
  const id = uuidv4();
  const insurance_pay = (total_amount * 0.6).toFixed(2);
  const individual_pay = (total_amount * 0.3).toFixed(2);
  const account_pay = (total_amount * 0.1).toFixed(2);
  
  db.prepare(`
    INSERT INTO settlement_records 
    (id, insured_person_id, offsite_record_id, settlement_type, hospital_name, total_amount, insurance_pay, individual_pay, account_pay, province_code, is_cross_province)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(id, insured_person_id, offsite_record_id, settlement_type, hospital_name, total_amount, insurance_pay, individual_pay, account_pay, to_province);
  
  res.json({
    id,
    message: '跨省门诊慢特病直接结算成功',
    from_province,
    to_province,
    settlement_details: {
      total_amount,
      insurance_pay,
      individual_pay,
      account_pay
    }
  });
});

module.exports = router;
