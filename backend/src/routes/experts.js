const express = require('express');
const db = require('../database');
const router = express.Router();

function isExpertValid(expert) {
  if (expert.is_blacklisted) return false;
  if (expert.qualification_valid_until) {
    const validUntil = new Date(expert.qualification_valid_until);
    const now = new Date();
    if (validUntil < now) return false;
  }
  return true;
}

router.get('/', (req, res) => {
  const { field, region, company, valid_only } = req.query;
  let query = 'SELECT * FROM experts WHERE 1=1';
  const params = [];

  if (field) {
    query += ' AND professional_field LIKE ?';
    params.push(`%${field}%`);
  }
  if (region) {
    query += ' AND region = ?';
    params.push(region);
  }
  if (company) {
    query += ' AND company LIKE ?';
    params.push(`%${company}%`);
  }

  query += ' ORDER BY created_at DESC';
  const stmt = db.prepare(query);
  let experts = stmt.all(...params);

  if (valid_only === 'true') {
    experts = experts.filter(isExpertValid);
  }

  experts = experts.map(e => ({
    ...e,
    is_valid: isExpertValid(e)
  }));

  res.json(experts);
});

router.get('/:id', (req, res) => {
  const stmt = db.prepare('SELECT * FROM experts WHERE id = ?');
  const expert = stmt.get(req.params.id);
  if (!expert) {
    return res.status(404).json({ error: '专家不存在' });
  }

  const historyStmt = db.prepare('SELECT * FROM expert_review_history WHERE expert_id = ? ORDER BY review_date DESC');
  const history = historyStmt.all(req.params.id);

  res.json({
    ...expert,
    is_valid: isExpertValid(expert),
    review_history: history
  });
});

router.post('/', (req, res) => {
  const { name, phone, email, professional_field, title, company, region, qualification_valid_until } = req.body;

  if (!name || !professional_field || !company || !region) {
    return res.status(400).json({ error: '必填字段缺失' });
  }

  const stmt = db.prepare(`
    INSERT INTO experts (name, phone, email, professional_field, title, company, region, qualification_valid_until)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(name, phone, email, professional_field, title, company, region, qualification_valid_until);

  req.audit('create', 'expert', result.lastInsertRowid, { name, professional_field, company });

  res.status(201).json({ id: result.lastInsertRowid, message: '创建成功' });
});

router.put('/:id', (req, res) => {
  const { name, phone, email, professional_field, title, company, region, qualification_valid_until, is_blacklisted } = req.body;

  const checkStmt = db.prepare('SELECT * FROM experts WHERE id = ?');
  const existing = checkStmt.get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: '专家不存在' });
  }

  const stmt = db.prepare(`
    UPDATE experts SET
      name = COALESCE(?, name),
      phone = COALESCE(?, phone),
      email = COALESCE(?, email),
      professional_field = COALESCE(?, professional_field),
      title = COALESCE(?, title),
      company = COALESCE(?, company),
      region = COALESCE(?, region),
      qualification_valid_until = COALESCE(?, qualification_valid_until),
      is_blacklisted = COALESCE(?, is_blacklisted),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(name, phone, email, professional_field, title, company, region, qualification_valid_until, is_blacklisted, req.params.id);

  req.audit('update', 'expert', req.params.id, { name, professional_field, company, is_blacklisted });

  res.json({ message: '更新成功' });
});

router.delete('/:id', (req, res) => {
  const checkStmt = db.prepare('SELECT * FROM experts WHERE id = ?');
  const existing = checkStmt.get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: '专家不存在' });
  }

  const stmt = db.prepare('DELETE FROM experts WHERE id = ?');
  stmt.run(req.params.id);

  req.audit('delete', 'expert', req.params.id, { name: existing.name });

  res.json({ message: '删除成功' });
});

router.post('/:id/history', (req, res) => {
  const { project_name, review_date, role } = req.body;

  if (!project_name) {
    return res.status(400).json({ error: '项目名称必填' });
  }

  const stmt = db.prepare(`
    INSERT INTO expert_review_history (expert_id, project_name, review_date, role)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(req.params.id, project_name, review_date, role);

  res.status(201).json({ id: result.lastInsertRowid, message: '历史记录添加成功' });
});

module.exports = router;
