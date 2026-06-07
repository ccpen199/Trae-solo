const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  const { page = 1, pageSize = 10, keyword, industry, scale } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = [];
  let params = [];
  
  if (keyword) {
    where.push('(name LIKE ? OR unified_credit_code LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (industry) {
    where.push('industry = ?');
    params.push(industry);
  }
  if (scale) {
    where.push('scale = ?');
    params.push(scale);
  }
  
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  
  const enterprises = db.prepare(`
    SELECT * FROM enterprises ${whereSql}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM enterprises ${whereSql}
  `).get(...params).count;
  
  res.json({ list: enterprises, total });
});

router.get('/my', auth, (req, res) => {
  const bindings = db.prepare(`
    SELECT e.*, eb.role, eb.status as binding_status
    FROM enterprise_bindings eb
    JOIN enterprises e ON eb.enterprise_id = e.id
    WHERE eb.user_id = ?
  `).all(req.userId);
  
  res.json(bindings);
});

router.get('/:id', auth, (req, res) => {
  const enterprise = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(req.params.id);
  
  if (!enterprise) {
    return res.status(404).json({ error: '企业不存在' });
  }
  
  res.json(enterprise);
});

router.post('/', auth, (req, res) => {
  const { name, unifiedCreditCode, legalPerson, legalPersonIdCard, industry, scale, registeredCapital, address, contactPhone } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO enterprises (name, unified_credit_code, legal_person, legal_person_id_card, industry, scale, registered_capital, address, contact_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, unifiedCreditCode, legalPerson, legalPersonIdCard, industry, scale, registeredCapital, address, contactPhone);
    
    db.prepare(`
      INSERT INTO enterprise_bindings (user_id, enterprise_id, role, status, verified_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.userId, result.lastInsertRowid, 'admin', 'verified', new Date().toISOString());
    
    res.json({ id: result.lastInsertRowid, message: '企业创建成功' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: '统一社会信用代码已存在' });
    }
    res.status(500).json({ error: '创建失败' });
  }
});

router.get('/:id/org', auth, (req, res) => {
  const orgList = db.prepare(`
    SELECT * FROM enterprise_org 
    WHERE enterprise_id = ?
    ORDER BY sort_order ASC, id ASC
  `).all(req.params.id);
  
  const buildTree = (parentId = 0) => {
    return orgList
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        children: buildTree(item.id)
      }));
  };
  
  res.json(buildTree());
});

router.post('/:id/org', auth, (req, res) => {
  const { parentId = 0, name, type, manager, phone, sortOrder = 0 } = req.body;
  
  const result = db.prepare(`
    INSERT INTO enterprise_org (enterprise_id, parent_id, name, type, manager, phone, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, parentId, name, type, manager, phone, sortOrder);
  
  res.json({ id: result.lastInsertRowid, message: '部门创建成功' });
});

router.put('/:id/org/:orgId', auth, (req, res) => {
  const { name, type, manager, phone, sortOrder } = req.body;
  
  db.prepare(`
    UPDATE enterprise_org 
    SET name = ?, type = ?, manager = ?, phone = ?, sort_order = ?
    WHERE id = ? AND enterprise_id = ?
  `).run(name, type, manager, phone, sortOrder, req.params.orgId, req.params.id);
  
  res.json({ message: '更新成功' });
});

router.delete('/:id/org/:orgId', auth, (req, res) => {
  const hasChildren = db.prepare('SELECT COUNT(*) as count FROM enterprise_org WHERE parent_id = ?').get(req.params.orgId).count > 0;
  
  if (hasChildren) {
    return res.status(400).json({ error: '请先删除子部门' });
  }
  
  db.prepare('DELETE FROM enterprise_org WHERE id = ? AND enterprise_id = ?').run(req.params.orgId, req.params.id);
  
  res.json({ message: '删除成功' });
});

router.post('/:id/bind', auth, (req, res) => {
  const { idCard, name } = req.body;
  
  const enterprise = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(req.params.id);
  
  if (!enterprise) {
    return res.status(404).json({ error: '企业不存在' });
  }
  
  const isLegalPerson = enterprise.legal_person_id_card === idCard && enterprise.legal_person === name;
  
  try {
    db.prepare(`
      INSERT INTO enterprise_bindings (user_id, enterprise_id, role, status, verified_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.userId, req.params.id, 'employee', isLegalPerson ? 'verified' : 'pending', isLegalPerson ? new Date().toISOString() : null);
    
    res.json({ 
      message: isLegalPerson ? '法人身份验证成功，已绑定' : '绑定申请已提交，等待审核',
      status: isLegalPerson ? 'verified' : 'pending'
    });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: '已绑定该企业' });
    }
    res.status(500).json({ error: '绑定失败' });
  }
});

module.exports = router;
