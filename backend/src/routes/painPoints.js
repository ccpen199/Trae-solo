const express = require('express');
const { db } = require('../database');
const { v4: uuidv4 } = require('uuid');
const { createAuditLog } = require('../audit');

const router = express.Router({ mergeParams: true });

router.get('/', (req, res) => {
  const painPoints = db.prepare(`
    SELECT * FROM pain_points WHERE interview_id = ? ORDER BY created_at DESC
  `).all(req.params.interviewId);
  res.json(painPoints);
});

router.post('/', (req, res) => {
  const { topic_id, title, description, severity, frequency } = req.body;
  
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }
  
  const id = uuidv4();
  db.prepare(`
    INSERT INTO pain_points (id, interview_id, topic_id, title, description, severity, frequency, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.interviewId, topic_id || null, title, description, severity || 'medium', frequency || 'occasional', req.user.id);
  
  const painPoint = db.prepare('SELECT * FROM pain_points WHERE id = ?').get(id);
  
  createAuditLog({
    interviewId: req.params.interviewId,
    actionType: 'create',
    objectType: 'pain_point',
    objectId: id,
    actor: req.user,
    changeReason: '识别新痛点',
    affectedFields: ['title', 'description', 'severity', 'frequency'],
    newValues: { title, severity, frequency }
  });
  
  res.status(201).json(painPoint);
});

router.put('/:id', (req, res) => {
  const painPoint = db.prepare('SELECT * FROM pain_points WHERE id = ?').get(req.params.id);
  if (!painPoint) {
    return res.status(404).json({ error: 'Pain point not found' });
  }
  
  const oldValues = { ...painPoint };
  const { title, description, severity, frequency, status } = req.body;
  
  db.prepare(`
    UPDATE pain_points 
    SET title = ?, description = ?, severity = ?, frequency = ?, status = COALESCE(?, status),
        updated_at = strftime('%s', 'now')
    WHERE id = ?
  `).run(title || painPoint.title, description || painPoint.description, 
         severity || painPoint.severity, frequency || painPoint.frequency, 
         status || null, req.params.id);
  
  createAuditLog({
    interviewId: painPoint.interview_id,
    actionType: 'update',
    objectType: 'pain_point',
    objectId: req.params.id,
    actor: req.user,
    changeReason: req.body.changeReason || '更新痛点信息',
    affectedFields: Object.keys(req.body).filter(k => k !== 'changeReason'),
    oldValues,
    newValues: { title: title || oldValues.title, status: status || oldValues.status }
  });
  
  const updated = db.prepare('SELECT * FROM pain_points WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const painPoint = db.prepare('SELECT * FROM pain_points WHERE id = ?').get(req.params.id);
  if (!painPoint) {
    return res.status(404).json({ error: 'Pain point not found' });
  }
  
  db.prepare('DELETE FROM pain_points WHERE id = ?').run(req.params.id);
  
  createAuditLog({
    interviewId: painPoint.interview_id,
    actionType: 'delete',
    objectType: 'pain_point',
    objectId: req.params.id,
    actor: req.user,
    changeReason: req.body.reason || '删除痛点',
    oldValues: painPoint
  });
  
  res.json({ success: true });
});

module.exports = router;
