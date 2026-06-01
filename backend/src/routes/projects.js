const express = require('express');
const db = require('../database');
const crypto = require('crypto');
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

function seededRandom(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return function() {
    hash = Math.sin(hash) * 10000;
    return hash - Math.floor(hash);
  };
}

router.get('/', (req, res) => {
  const { status, type } = req.query;
  let query = 'SELECT * FROM projects WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  query += ' ORDER BY created_at DESC';
  const stmt = db.prepare(query);
  const projects = stmt.all(...params);

  res.json(projects);
});

router.get('/:id', (req, res) => {
  const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  const project = stmt.get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: '项目不存在' });
  }

  const extractionStmt = db.prepare('SELECT * FROM extraction_records WHERE project_id = ? ORDER BY extracted_at DESC');
  const extractions = extractionStmt.all(req.params.id);

  res.json({
    ...project,
    extractions: extractions.map(e => ({
      ...e,
      candidate_pool: JSON.parse(e.candidate_pool),
      selected_experts: JSON.parse(e.selected_experts),
      alternate_experts: JSON.parse(e.alternate_experts)
    }))
  });
});

router.post('/', (req, res) => {
  const { name, type, professional_field, expert_count, alternate_count, region, confidentiality_level,回避_units, requirements, created_by } = req.body;

  if (!name || !type || !professional_field || !expert_count) {
    return res.status(400).json({ error: '必填字段缺失' });
  }

  const stmt = db.prepare(`
    INSERT INTO projects (name, type, professional_field, expert_count, alternate_count, region, confidentiality_level,回避_units, requirements, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(name, type, professional_field, expert_count, alternate_count || 2, region, confidentiality_level || '普通', 回避_units, requirements, created_by || 'admin');

  req.audit('create', 'project', result.lastInsertRowid, { name, type, professional_field, expert_count });

  res.status(201).json({ id: result.lastInsertRowid, message: '项目创建成功' });
});

router.put('/:id', (req, res) => {
  const { name, type, professional_field, expert_count, alternate_count, region, confidentiality_level,回避_units, requirements, status } = req.body;

  const checkStmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  const existing = checkStmt.get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: '项目不存在' });
  }

  const stmt = db.prepare(`
    UPDATE projects SET
      name = COALESCE(?, name),
      type = COALESCE(?, type),
      professional_field = COALESCE(?, professional_field),
      expert_count = COALESCE(?, expert_count),
      alternate_count = COALESCE(?, alternate_count),
      region = COALESCE(?, region),
      confidentiality_level = COALESCE(?, confidentiality_level),
      回避_units = COALESCE(?,回避_units),
      requirements = COALESCE(?, requirements),
      status = COALESCE(?, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(name, type, professional_field, expert_count, alternate_count, region, confidentiality_level,回避_units, requirements, status, req.params.id);

  req.audit('update', 'project', req.params.id, { name, status });

  res.json({ message: '更新成功' });
});

router.delete('/:id', (req, res) => {
  const checkStmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  const existing = checkStmt.get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: '项目不存在' });
  }

  const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
  stmt.run(req.params.id);

  req.audit('delete', 'project', req.params.id, { name: existing.name });

  res.json({ message: '删除成功' });
});

router.post('/:id/extract', (req, res) => {
  const { supervisor, extracted_by } = req.body;

  const projectStmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  const project = projectStmt.get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: '项目不存在' });
  }

  let query = 'SELECT * FROM experts WHERE professional_field LIKE ?';
  const params = [`%${project.professional_field}%`];

  if (project.region) {
    query += ' AND region = ?';
    params.push(project.region);
  }

  const allExperts = db.prepare(query).all(...params);
  const validExperts = allExperts.filter(isExpertValid);

  const avoidUnits = project['回避_units'] ? project['回避_units'].split(',').map(u => u.trim()) : [];
  const candidatePool = validExperts.filter(e => {
    return !avoidUnits.some(unit => e.company.includes(unit));
  });

  if (candidatePool.length < project.expert_count) {
    return res.status(400).json({ 
      error: '候选专家数量不足',
      available: candidatePool.length,
      required: project.expert_count
    });
  }

  const seed = crypto.randomBytes(16).toString('hex');
  const random = seededRandom(seed);

  const shuffled = [...candidatePool].sort(() => random() - 0.5);

  const selected = shuffled.slice(0, project.expert_count);
  const alternate = shuffled.slice(project.expert_count, project.expert_count + (project.alternate_count || 2));

  const insertStmt = db.prepare(`
    INSERT INTO extraction_records (project_id, random_seed, candidate_pool, selected_experts, alternate_experts, supervisor, extracted_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const candidateIds = candidatePool.map(e => ({ id: e.id, name: e.name, company: e.company }));
  const selectedIds = selected.map(e => ({ id: e.id, name: e.name, company: e.company, phone: e.phone, email: e.email }));
  const alternateIds = alternate.map(e => ({ id: e.id, name: e.name, company: e.company, phone: e.phone, email: e.email }));

  const result = insertStmt.run(
    project.id,
    seed,
    JSON.stringify(candidateIds),
    JSON.stringify(selectedIds),
    JSON.stringify(alternateIds),
    supervisor || '未指定',
    extracted_by || 'admin'
  );

  const notificationStmt = db.prepare(`
    INSERT INTO notifications (extraction_id, expert_id, expert_name, is_alternate)
    VALUES (?, ?, ?, ?)
  `);

  selected.forEach(e => {
    notificationStmt.run(result.lastInsertRowid, e.id, e.name, 0);
  });

  alternate.forEach(e => {
    notificationStmt.run(result.lastInsertRowid, e.id, e.name, 1);
  });

  const updateStmt = db.prepare('UPDATE projects SET status = ? WHERE id = ?');
  updateStmt.run('extracted', project.id);

  req.audit('extract', 'project', project.id, {
    seed,
    candidate_count: candidatePool.length,
    selected_count: selected.length,
    alternate_count: alternate.length
  });

  res.status(201).json({
    id: result.lastInsertRowid,
    seed,
    candidate_pool: candidateIds,
    selected_experts: selectedIds,
    alternate_experts: alternateIds
  });
});

router.get('/:id/extractions', (req, res) => {
  const stmt = db.prepare('SELECT * FROM extraction_records WHERE project_id = ? ORDER BY extracted_at DESC');
  const extractions = stmt.all(req.params.id);

  res.json(extractions.map(e => ({
    ...e,
    candidate_pool: JSON.parse(e.candidate_pool),
    selected_experts: JSON.parse(e.selected_experts),
    alternate_experts: JSON.parse(e.alternate_experts)
  })));
});

module.exports = router;
