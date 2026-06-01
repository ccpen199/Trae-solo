const express = require('express');
const { db } = require('../database');
const { v4: uuidv4 } = require('uuid');
const { createAuditLog } = require('../audit');

const router = express.Router({ mergeParams: true });

router.get('/', (req, res) => {
  const summaries = db.prepare(`
    SELECT * FROM summaries WHERE interview_id = ? ORDER BY version DESC
  `).all(req.params.interviewId);
  res.json(summaries);
});

router.post('/', (req, res) => {
  const { type, content } = req.body;
  
  if (!type || !content) {
    return res.status(400).json({ error: 'Type and content are required' });
  }
  
  const id = uuidv4();
  db.prepare(`
    INSERT INTO summaries (id, interview_id, type, content, created_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, req.params.interviewId, type, content, req.user.id);
  
  db.prepare(`
    UPDATE interviews SET status = 'completed', updated_at = strftime('%s', 'now')
    WHERE id = ?
  `).run(req.params.interviewId);
  
  const summary = db.prepare('SELECT * FROM summaries WHERE id = ?').get(id);
  
  createAuditLog({
    interviewId: req.params.interviewId,
    actionType: 'create',
    objectType: 'summary',
    objectId: id,
    actor: req.user,
    changeReason: `生成${type === 'executive' ? '执行摘要' : type === 'detailed' ? '详细总结' : '行动项'}`,
    affectedFields: ['type', 'content'],
    newValues: { type, content: content.substring(0, 100) + '...' }
  });
  
  res.status(201).json(summary);
});

router.put('/:id', (req, res) => {
  const summary = db.prepare('SELECT * FROM summaries WHERE id = ?').get(req.params.id);
  if (!summary) {
    return res.status(404).json({ error: 'Summary not found' });
  }
  
  const oldValues = { ...summary };
  const { content } = req.body;
  
  db.prepare(`
    INSERT INTO summaries (id, interview_id, type, content, created_by, version)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), summary.interview_id, summary.type, content, req.user.id, summary.version + 1);
  
  db.prepare(`
    UPDATE summaries SET version = version + 1 WHERE id = ?
  `).run(req.params.id);
  
  const newSummary = db.prepare(`
    SELECT * FROM summaries WHERE interview_id = ? AND type = ? ORDER BY version DESC LIMIT 1
  `).get(summary.interview_id, summary.type);
  
  createAuditLog({
    interviewId: summary.interview_id,
    actionType: 'update',
    objectType: 'summary',
    objectId: newSummary.id,
    actor: req.user,
    changeReason: req.body.changeReason || '更新总结内容',
    affectedFields: ['content'],
    oldValues: { ...oldValues, content: oldValues.content.substring(0, 100) + '...' },
    newValues: { content: content.substring(0, 100) + '...' },
    recoveryPath: `/api/interviews/${summary.interview_id}/summaries/version/${oldValues.version}`
  });
  
  res.json(newSummary);
});

module.exports = router;
