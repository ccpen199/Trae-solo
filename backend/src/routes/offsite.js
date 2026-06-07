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
    whereClause = 'WHERE o.status = ?';
    params.push(status);
  }
  
  const list = db.prepare(`
    SELECT o.*, ip.name as insured_name 
    FROM offsite_records o
    LEFT JOIN insured_persons ip ON o.insured_person_id = ip.id
    ${whereClause}
    ORDER BY o.created_at DESC 
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM offsite_records o
    ${whereClause}
  `).get(...params);
  
  res.json({ list, total: total.count, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/person/:personId', (req, res) => {
  const records = db.prepare(`
    SELECT * FROM offsite_records 
    WHERE insured_person_id = ?
    ORDER BY created_at DESC
  `).all(req.params.personId);
  
  res.json(records);
});

router.get('/:id', (req, res) => {
  const record = db.prepare(`
    SELECT o.*, ip.name as insured_name, ip.id_card, ip.medical_card_number
    FROM offsite_records o
    LEFT JOIN insured_persons ip ON o.insured_person_id = ip.id
    WHERE o.id = ?
  `).get(req.params.id);
  
  if (!record) {
    return res.status(404).json({ error: '备案记录不存在' });
  }
  res.json(record);
});

router.post('/', (req, res) => {
  const { insured_person_id, record_type, from_area, to_area, start_date, end_date, reason } = req.body;
  
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO offsite_records 
    (id, insured_person_id, record_type, from_area, to_area, start_date, end_date, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, '待审核')
  `).run(id, insured_person_id, record_type, from_area, to_area, start_date, end_date, reason);
  
  res.json({ id, ...req.body, status: '待审核' });
});

router.put('/:id/audit', (req, res) => {
  const { status, auditor, remarks } = req.body;
  
  if (!['已通过', '已驳回'].includes(status)) {
    return res.status(400).json({ error: '无效的审核状态' });
  }
  
  db.prepare(`
    UPDATE offsite_records 
    SET status = ?, auditor = ?, audit_time = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, auditor, req.params.id);
  
  res.json({ id: req.params.id, status, auditor, audit_time: new Date().toISOString() });
});

module.exports = router;
