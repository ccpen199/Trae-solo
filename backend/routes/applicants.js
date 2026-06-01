const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/', (req, res) => {
  const { keyword } = req.query;
  let sql = 'SELECT * FROM applicants WHERE 1=1';
  const params = [];
  
  if (keyword) {
    sql += ' AND (applicant_name LIKE ? OR id_number LIKE ? OR phone LIKE ?)';
    const search = `%${keyword}%`;
    params.push(search, search, search);
  }
  sql += ' ORDER BY created_at DESC';
  
  const applicants = db.prepare(sql).all(...params);
  res.json({ success: true, data: applicants });
});

router.get('/:id', (req, res) => {
  const applicant = db.prepare('SELECT * FROM applicants WHERE id = ?').get(req.params.id);
  if (!applicant) {
    return res.status(404).json({ success: false, message: '申请人不存在' });
  }
  
  const certificates = db.prepare(`
    SELECT c.*, t.template_name
    FROM certificates c
    LEFT JOIN certificate_templates t ON c.template_id = t.id
    WHERE c.applicant_id = ?
    ORDER BY c.created_at DESC
  `).all(req.params.id).map(c => ({
    ...c,
    certificate_data: JSON.parse(c.certificate_data)
  }));
  
  res.json({ success: true, data: { ...applicant, certificates } });
});

router.post('/', (req, res) => {
  const { applicant_name, id_type, id_number, phone, email, address } = req.body;
  
  if (!applicant_name || !id_type || !id_number) {
    return res.status(400).json({ success: false, message: '缺少必填字段' });
  }
  
  const existing = db.prepare('SELECT id FROM applicants WHERE id_number = ?').get(id_number);
  if (existing) {
    return res.status(400).json({ success: false, message: '该证件号已存在' });
  }
  
  try {
    const info = db.prepare(`
      INSERT INTO applicants (applicant_name, id_type, id_number, phone, email, address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(applicant_name, id_type, id_number, phone || '', email || '', address || '');
    
    res.json({ success: true, data: { id: info.lastInsertRowid } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { applicant_name, id_type, id_number, phone, email, address } = req.body;
  
  const applicant = db.prepare('SELECT * FROM applicants WHERE id = ?').get(req.params.id);
  if (!applicant) {
    return res.status(404).json({ success: false, message: '申请人不存在' });
  }
  
  db.prepare(`
    UPDATE applicants 
    SET applicant_name = ?, id_type = ?, id_number = ?, phone = ?, email = ?, address = ?
    WHERE id = ?
  `).run(
    applicant_name || applicant.applicant_name,
    id_type || applicant.id_type,
    id_number || applicant.id_number,
    phone || applicant.phone,
    email || applicant.email,
    address || applicant.address,
    req.params.id
  );
  
  res.json({ success: true, message: '更新成功' });
});

module.exports = router;
