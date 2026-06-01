const express = require('express');
const router = express.Router();
const db = require('../database/init');

router.get('/', (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT c.*, j.name as judge_name, cl.name as clerk_name 
    FROM cases c 
    LEFT JOIN judges j ON c.judge_id = j.id 
    LEFT JOIN clerks cl ON c.clerk_id = cl.id
  `;
  const params = [];
  
  if (status) {
    query += ' WHERE c.status = ?';
    params.push(status);
  }
  query += ' ORDER BY c.priority ASC, c.created_at DESC';
  
  const cases = db.prepare(query).all(...params);
  res.json(cases);
});

router.get('/:id', (req, res) => {
  const caseData = db.prepare(`
    SELECT c.*, j.name as judge_name, cl.name as clerk_name 
    FROM cases c 
    LEFT JOIN judges j ON c.judge_id = j.id 
    LEFT JOIN clerks cl ON c.clerk_id = cl.id
    WHERE c.id = ?
  `).get(req.params.id);
  
  if (!caseData) {
    return res.status(404).json({ error: 'Case not found' });
  }
  
  const materials = db.prepare('SELECT * FROM case_materials WHERE case_id = ?').all(req.params.id);
  const timeline = db.prepare('SELECT * FROM case_timeline WHERE case_id = ? ORDER BY created_at DESC').all(req.params.id);
  
  res.json({ ...caseData, materials, timeline });
});

router.post('/', (req, res) => {
  const {
    case_number, case_type, case_reason, judge_id, clerk_id,
    parties, agents, estimated_duration, priority, materials
  } = req.body;

  const result = db.prepare(`
    INSERT INTO cases (case_number, case_type, case_reason, judge_id, clerk_id, 
                       parties, agents, estimated_duration, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(case_number, case_type, case_reason, judge_id || null, clerk_id || null,
         parties, agents || null, estimated_duration, priority || 2);

  const caseId = result.lastInsertRowid;

  if (materials && materials.length > 0) {
    const insertMaterial = db.prepare(`
      INSERT INTO case_materials (case_id, material_name, material_type, is_submitted)
      VALUES (?, ?, ?, ?)
    `);
    materials.forEach(m => {
      insertMaterial.run(caseId, m.name, m.type || null, m.is_submitted ? 1 : 0);
    });
  }

  db.prepare(`
    INSERT INTO case_timeline (case_id, event_type, event_content, operator)
    VALUES (?, 'create', '案件登记完成', 'system')
  `).run(caseId);

  res.status(201).json({ id: caseId, ...req.body });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    case_number, case_type, case_reason, judge_id, clerk_id,
    parties, agents, estimated_duration, priority, status, materials_complete
  } = req.body;

  db.prepare(`
    UPDATE cases SET 
      case_number = ?, case_type = ?, case_reason = ?, judge_id = ?, clerk_id = ?,
      parties = ?, agents = ?, estimated_duration = ?, priority = ?, 
      status = ?, materials_complete = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(case_number, case_type, case_reason, judge_id || null, clerk_id || null,
         parties, agents || null, estimated_duration, priority, status,
         materials_complete ? 1 : 0, id);

  db.prepare(`
    INSERT INTO case_timeline (case_id, event_type, event_content, operator)
    VALUES (?, 'update', '案件信息已更新', 'system')
  `).run(id);

  res.json({ message: 'Case updated successfully' });
});

router.post('/:id/check-materials', (req, res) => {
  const { id } = req.params;
  const materials = db.prepare('SELECT * FROM case_materials WHERE case_id = ?').all(id);
  
  const allSubmitted = materials.length > 0 && materials.every(m => m.is_submitted === 1);
  
  if (allSubmitted) {
    db.prepare('UPDATE cases SET materials_complete = 1, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('pending_scheduling', id);
    
    db.prepare(`
      INSERT INTO case_timeline (case_id, event_type, event_content, operator)
      VALUES (?, 'status_change', '材料审核通过，进入排期队列', 'system')
    `).run(id);
  }

  res.json({
    materials_complete: allSubmitted ? 1 : 0,
    materials,
    can_schedule: allSubmitted
  });
});

router.get('/:id/timeline', (req, res) => {
  const timeline = db.prepare(`
    SELECT * FROM case_timeline 
    WHERE case_id = ? 
    ORDER BY created_at DESC
  `).all(req.params.id);
  res.json(timeline);
});

module.exports = router;
