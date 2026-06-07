const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;
  
  const list = db.prepare(`
    SELECT ec.*, ip.name, ip.id_card 
    FROM electronic_credentials ec
    LEFT JOIN insured_persons ip ON ec.insured_person_id = ip.id
    ORDER BY ec.issued_at DESC 
    LIMIT ? OFFSET ?
  `).all(parseInt(pageSize), offset);
  
  const total = db.prepare('SELECT COUNT(*) as count FROM electronic_credentials').get();
  
  res.json({ list, total: total.count, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', (req, res) => {
  const credential = db.prepare(`
    SELECT ec.*, ip.name, ip.id_card, ip.medical_card_number
    FROM electronic_credentials ec
    LEFT JOIN insured_persons ip ON ec.insured_person_id = ip.id
    WHERE ec.id = ?
  `).get(req.params.id);
  
  if (!credential) {
    return res.status(404).json({ error: '凭证不存在' });
  }
  res.json(credential);
});

router.post('/', (req, res) => {
  const { insured_person_id } = req.body;
  
  const person = db.prepare('SELECT * FROM insured_persons WHERE id = ?').get(insured_person_id);
  if (!person) {
    return res.status(404).json({ error: '参保人不存在' });
  }
  
  const existing = db.prepare('SELECT * FROM electronic_credentials WHERE insured_person_id = ? AND status = ?').get(insured_person_id, '有效');
  if (existing) {
    return res.status(400).json({ error: '该参保人已有有效电子凭证' });
  }
  
  const id = uuidv4();
  const credential_number = 'YBDZ' + Date.now().toString() + Math.random().toString(36).slice(-4).toUpperCase();
  const qr_code = Buffer.from(credential_number).toString('base64');
  const expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  
  db.prepare(`
    INSERT INTO electronic_credentials 
    (id, insured_person_id, credential_number, qr_code, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, insured_person_id, credential_number, qr_code, expires_at);
  
  res.json({ id, credential_number, qr_code, expires_at, ...req.body });
});

router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  
  db.prepare(`
    UPDATE electronic_credentials 
    SET status = ?
    WHERE id = ?
  `).run(status, req.params.id);
  
  res.json({ id: req.params.id, status });
});

router.post('/:id/use', (req, res) => {
  db.prepare(`
    UPDATE electronic_credentials 
    SET last_used_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);
  
  res.json({ success: true, last_used_at: new Date().toISOString() });
});

module.exports = router;
