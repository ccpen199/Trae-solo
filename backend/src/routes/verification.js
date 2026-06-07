const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, result, verify_type } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (result) {
    whereClause += ' AND result = ?';
    params.push(result);
  }
  
  if (verify_type) {
    whereClause += ' AND verify_type = ?';
    params.push(verify_type);
  }
  
  const list = db.prepare(`
    SELECT v.*, ip.name as insured_name 
    FROM qualification_verifications v
    LEFT JOIN insured_persons ip ON v.insured_person_id = ip.id
    ${whereClause}
    ORDER BY v.verify_time DESC 
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM qualification_verifications v
    ${whereClause}
  `).get(...params);
  
  res.json({ list, total: total.count, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', (req, res) => {
  const verification = db.prepare(`
    SELECT v.*, ip.name as insured_name, ip.id_card
    FROM qualification_verifications v
    LEFT JOIN insured_persons ip ON v.insured_person_id = ip.id
    WHERE v.id = ?
  `).get(req.params.id);
  
  if (!verification) {
    return res.status(404).json({ error: '认证记录不存在' });
  }
  res.json(verification);
});

router.post('/', (req, res) => {
  const { insured_person_id, verify_type, verifier, similarity_score, remarks } = req.body;
  
  const id = uuidv4();
  const result = similarity_score >= 85 ? '通过' : similarity_score >= 70 ? '待核验' : '未通过';
  
  db.prepare(`
    INSERT INTO qualification_verifications 
    (id, insured_person_id, verify_type, result, verifier, similarity_score, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, insured_person_id, verify_type, result, verifier, similarity_score, remarks);
  
  res.json({ id, ...req.body, result });
});

router.post('/video', (req, res) => {
  const { insured_person_id, verifier } = req.body;
  
  const id = uuidv4();
  const result = '待核验';
  const verify_type = '远程视频';
  
  db.prepare(`
    INSERT INTO qualification_verifications 
    (id, insured_person_id, verify_type, result, verifier)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, insured_person_id, verify_type, result, verifier);
  
  res.json({
    id,
    message: '远程视频认证已创建',
    insured_person_id,
    verify_type,
    result,
    video_session_url: `/video-session/${id}`
  });
});

router.put('/:id/result', (req, res) => {
  const { result, verifier, similarity_score, remarks } = req.body;
  
  db.prepare(`
    UPDATE qualification_verifications 
    SET result = ?, verifier = ?, similarity_score = ?, remarks = ?
    WHERE id = ?
  `).run(result, verifier, similarity_score, remarks, req.params.id);
  
  res.json({ id: req.params.id, result });
});

module.exports = router;
