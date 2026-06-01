const express = require('express');
const { db } = require('../database');
const { v4: uuidv4 } = require('uuid');
const { createAuditLog } = require('../audit');

const router = express.Router({ mergeParams: true });

router.get('/', (req, res) => {
  const speakers = db.prepare(`
    SELECT * FROM speakers WHERE interview_id = ?
  `).all(req.params.interviewId);
  res.json(speakers);
});

router.post('/', (req, res) => {
  const { name, role, color } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Speaker name is required' });
  }
  
  const id = uuidv4();
  db.prepare(`
    INSERT INTO speakers (id, interview_id, name, role, color)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, req.params.interviewId, name, role || null, color || '#3b82f6');
  
  const speaker = db.prepare('SELECT * FROM speakers WHERE id = ?').get(id);
  
  createAuditLog({
    interviewId: req.params.interviewId,
    actionType: 'create',
    objectType: 'speaker',
    objectId: id,
    actor: req.user,
    changeReason: '添加说话人',
    affectedFields: ['name', 'role'],
    newValues: { name, role }
  });
  
  res.status(201).json(speaker);
});

router.put('/:id', (req, res) => {
  const speaker = db.prepare('SELECT * FROM speakers WHERE id = ?').get(req.params.id);
  if (!speaker) {
    return res.status(404).json({ error: 'Speaker not found' });
  }
  
  const oldValues = { ...speaker };
  const { name, role, color } = req.body;
  
  db.prepare(`
    UPDATE speakers SET name = ?, role = ?, color = ?
    WHERE id = ?
  `).run(name || speaker.name, role || speaker.role, color || speaker.color, req.params.id);
  
  createAuditLog({
    interviewId: speaker.interview_id,
    actionType: 'update',
    objectType: 'speaker',
    objectId: req.params.id,
    actor: req.user,
    changeReason: req.body.changeReason || '更新说话人信息',
    affectedFields: Object.keys(req.body).filter(k => k !== 'changeReason'),
    oldValues,
    newValues: { name: name || oldValues.name, role: role || oldValues.role }
  });
  
  const updated = db.prepare('SELECT * FROM speakers WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const speaker = db.prepare('SELECT * FROM speakers WHERE id = ?').get(req.params.id);
  if (!speaker) {
    return res.status(404).json({ error: 'Speaker not found' });
  }
  
  db.prepare('DELETE FROM speakers WHERE id = ?').run(req.params.id);
  
  createAuditLog({
    interviewId: speaker.interview_id,
    actionType: 'delete',
    objectType: 'speaker',
    objectId: req.params.id,
    actor: req.user,
    changeReason: req.body.reason || '删除说话人',
    oldValues: speaker
  });
  
  res.json({ success: true });
});

module.exports = router;
