const express = require('express');
const { db } = require('../database');
const { v4: uuidv4 } = require('uuid');
const { createAuditLog } = require('../audit');
const { validateInterviewData, requireRole } = require('../middleware');

const router = express.Router();

router.get('/', (req, res) => {
  const { status, page = 1, limit = 20, sort = '-created_at' } = req.query;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT * FROM interviews';
  const params = [];
  
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
  const sortOrder = sort.startsWith('-') ? 'DESC' : 'ASC';
  query += ` ORDER BY ${sortField} ${sortOrder}`;
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  
  const interviews = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM interviews' + (status ? ' WHERE status = ?' : '')).get(...(status ? [status] : []));
  
  res.json({ data: interviews, total: total.count, page: parseInt(page), limit: parseInt(limit) });
});

router.get('/:id', (req, res) => {
  const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(req.params.id);
  if (!interview) {
    return res.status(404).json({ error: 'Interview not found' });
  }
  res.json(interview);
});

router.get('/:id/full', (req, res) => {
  const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(req.params.id);
  if (!interview) {
    return res.status(404).json({ error: 'Interview not found' });
  }
  
  const transcript = db.prepare('SELECT * FROM transcripts WHERE interview_id = ?').get(req.params.id);
  const speakers = db.prepare('SELECT * FROM speakers WHERE interview_id = ?').all(req.params.id);
  const topics = db.prepare('SELECT * FROM topics WHERE interview_id = ?').all(req.params.id);
  const painPoints = db.prepare('SELECT * FROM pain_points WHERE interview_id = ?').all(req.params.id);
  const evidence = db.prepare('SELECT * FROM evidence WHERE interview_id = ?').all(req.params.id);
  const summaries = db.prepare('SELECT * FROM summaries WHERE interview_id = ?').all(req.params.id);
  const segments = transcript ? 
    db.prepare('SELECT * FROM transcript_segments WHERE transcript_id = ?').all(transcript.id) : [];
  
  res.json({
    interview,
    transcript: transcript ? { ...transcript, segments } : null,
    speakers,
    topics,
    painPoints,
    evidence,
    summaries
  });
});

router.post('/', (req, res) => {
  const errors = validateInterviewData(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  const { title, description, interviewee_name, interviewee_role, interview_date } = req.body;
  const id = uuidv4();
  
  const stmt = db.prepare(`
    INSERT INTO interviews (id, title, description, interviewee_name, interviewee_role, interview_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, title, description || null, interviewee_name || null, interviewee_role || null, 
    interview_date ? Math.floor(new Date(interview_date).getTime() / 1000) : null, req.user.id);
  
  createAuditLog({
    interviewId: id,
    actionType: 'create',
    objectType: 'interview',
    objectId: id,
    actor: req.user,
    changeReason: '创建新访谈',
    affectedFields: ['title', 'description', 'interviewee_name', 'interviewee_role'],
    newValues: { title, description, interviewee_name, interviewee_role }
  });
  
  const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(id);
  res.status(201).json(interview);
});

router.put('/:id', (req, res) => {
  const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(req.params.id);
  if (!interview) {
    return res.status(404).json({ error: 'Interview not found' });
  }
  
  const errors = validateInterviewData(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  const oldValues = { ...interview };
  const { title, description, status, interviewee_name, interviewee_role, interview_date } = req.body;
  
  const stmt = db.prepare(`
    UPDATE interviews 
    SET title = ?, description = ?, status = COALESCE(?, status), 
        interviewee_name = ?, interviewee_role = ?, interview_date = ?,
        updated_at = strftime('%s', 'now'), version = version + 1
    WHERE id = ?
  `);
  
  stmt.run(title, description || null, status || null, interviewee_name || null, 
    interviewee_role || null, interview_date ? Math.floor(new Date(interview_date).getTime() / 1000) : null, req.params.id);
  
  const updated = db.prepare('SELECT * FROM interviews WHERE id = ?').get(req.params.id);
  
  createAuditLog({
    interviewId: req.params.id,
    actionType: 'update',
    objectType: 'interview',
    objectId: req.params.id,
    actor: req.user,
    changeReason: req.body.changeReason || '更新访谈信息',
    affectedFields: Object.keys(req.body).filter(k => k !== 'changeReason'),
    oldValues,
    newValues: updated,
    recoveryPath: `/api/interviews/${req.params.id}/revert/${oldValues.version}`
  });
  
  res.json(updated);
});

router.delete('/:id', requireRole(['business_owner', 'model_ops']), (req, res) => {
  const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(req.params.id);
  if (!interview) {
    return res.status(404).json({ error: 'Interview not found' });
  }
  
  db.prepare('DELETE FROM interviews WHERE id = ?').run(req.params.id);
  
  createAuditLog({
    interviewId: null,
    actionType: 'delete',
    objectType: 'interview',
    objectId: req.params.id,
    actor: req.user,
    changeReason: req.body.reason || '删除访谈',
    oldValues: interview
  });
  
  res.json({ success: true });
});

router.get('/:id/audit', (req, res) => {
  const logs = db.prepare(`
    SELECT * FROM audit_logs 
    WHERE interview_id = ? 
    ORDER BY created_at DESC
  `).all(req.params.id);
  
  res.json(logs);
});

router.post('/batch-status', requireRole(['business_owner', 'model_ops']), (req, res) => {
  const { ids, status, reason } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No interview IDs provided' });
  }
  
  const placeholders = ids.map(() => '?').join(',');
  const stmt = db.prepare(`
    UPDATE interviews 
    SET status = ?, updated_at = strftime('%s', 'now'), version = version + 1
    WHERE id IN (${placeholders})
  `);
  
  stmt.run(status, ...ids);
  
  ids.forEach(id => {
    createAuditLog({
      interviewId: id,
      actionType: 'batch_update',
      objectType: 'interview',
      objectId: id,
      actor: req.user,
      changeReason: reason || '批量更新状态',
      affectedFields: ['status'],
      newValues: { status }
    });
  });
  
  res.json({ success: true, updated: ids.length });
});

module.exports = router;
