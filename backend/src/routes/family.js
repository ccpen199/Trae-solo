const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, main_insured_id } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = '';
  const params = [];
  
  if (main_insured_id) {
    whereClause = 'WHERE fa.main_insured_id = ?';
    params.push(main_insured_id);
  }
  
  const list = db.prepare(`
    SELECT fa.*, 
           mip.name as main_name, 
           fip.name as member_name,
           fip.id_card as member_id_card
    FROM family_accounts fa
    LEFT JOIN insured_persons mip ON fa.main_insured_id = mip.id
    LEFT JOIN insured_persons fip ON fa.family_member_id = fip.id
    ${whereClause}
    ORDER BY fa.auth_date DESC 
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM family_accounts fa
    ${whereClause}
  `).get(...params);
  
  res.json({ list, total: total.count, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/main/:mainId/members', (req, res) => {
  const members = db.prepare(`
    SELECT fa.*, 
           fip.name as member_name,
           fip.id_card as member_id_card,
           fip.phone as member_phone
    FROM family_accounts fa
    LEFT JOIN insured_persons fip ON fa.family_member_id = fip.id
    WHERE fa.main_insured_id = ? AND fa.auth_status = '已授权'
    ORDER BY fa.auth_date DESC
  `).all(req.params.mainId);
  
  res.json(members);
});

router.get('/:id', (req, res) => {
  const account = db.prepare(`
    SELECT fa.*, 
           mip.name as main_name, 
           mip.id_card as main_id_card,
           mip.balance as main_balance,
           fip.name as member_name,
           fip.id_card as member_id_card
    FROM family_accounts fa
    LEFT JOIN insured_persons mip ON fa.main_insured_id = mip.id
    LEFT JOIN insured_persons fip ON fa.family_member_id = fip.id
    WHERE fa.id = ?
  `).get(req.params.id);
  
  if (!account) {
    return res.status(404).json({ error: '家庭共济账户不存在' });
  }
  res.json(account);
});

router.post('/', (req, res) => {
  const { main_insured_id, family_member_id, relation } = req.body;
  
  const existing = db.prepare(`
    SELECT * FROM family_accounts 
    WHERE main_insured_id = ? AND family_member_id = ? AND auth_status = '已授权'
  `).get(main_insured_id, family_member_id);
  
  if (existing) {
    return res.status(400).json({ error: '该家庭成员已授权' });
  }
  
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO family_accounts 
    (id, main_insured_id, family_member_id, relation, auth_status)
    VALUES (?, ?, ?, ?, '已授权')
  `).run(id, main_insured_id, family_member_id, relation);
  
  res.json({ id, ...req.body, auth_status: '已授权', auth_date: new Date().toISOString() });
});

router.put('/:id/cancel', (req, res) => {
  db.prepare(`
    UPDATE family_accounts 
    SET auth_status = '已取消', cancel_date = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);
  
  res.json({ id: req.params.id, auth_status: '已取消', cancel_date: new Date().toISOString() });
});

module.exports = router;
