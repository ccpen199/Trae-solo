const express = require('express');
const { db } = require('../database');
const { v4: uuidv4 } = require('uuid');
const { createAuditLog } = require('../audit');

const router = express.Router({ mergeParams: true });

router.get('/', (req, res) => {
  const evidence = db.prepare(`
    SELECT e.*, s.name as segment_text
    FROM evidence e 
    LEFT JOIN transcript_segments s ON e.segment_id = s.id
    WHERE e.interview_id = ? 
    ORDER BY e.created_at DESC
  `).all(req.params.interviewId);
  res.json(evidence);
});

router.post('/', (req, res) => {
  const { pain_point_id, topic_id, segment_id, quote, context, relevance_score } = req.body;
  
  if (!quote) {
    return res.status(400).json({ error: 'Quote is required' });
  }
  
  const id = uuidv4();
  db.prepare(`
    INSERT INTO evidence (id, interview_id, pain_point_id, topic_id, segment_id, quote, context, relevance_score, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.interviewId, pain_point_id || null, topic_id || null, 
         segment_id || null, quote, context || null, relevance_score || 0.8, req.user.id);
  
  const evidence = db.prepare('SELECT * FROM evidence WHERE id = ?').get(id);
  
  createAuditLog({
    interviewId: req.params.interviewId,
    actionType: 'create',
    objectType: 'evidence',
    objectId: id,
    actor: req.user,
    changeReason: '添加证据引用',
    affectedFields: ['quote', 'context'],
    newValues: { quote: quote.substring(0, 50) + '...' }
  });
  
  res.status(201).json(evidence);
});

router.put('/:id', (req, res) => {
  const evidence = db.prepare('SELECT * FROM evidence WHERE id = ?').get(req.params.id);
  if (!evidence) {
    return res.status(404).json({ error: 'Evidence not found' });
  }
  
  const oldValues = { ...evidence };
  const { quote, context, verified } = req.body;
  
  db.prepare(`
    UPDATE evidence 
    SET quote = ?, context = ?, verified = COALESCE(?, verified),
        verified_by = CASE WHEN ? = 1 AND verified = 0 THEN ? ELSE verified_by END,
        verified_at = CASE WHEN ? = 1 AND verified = 0 THEN strftime('%s', 'now') ELSE verified_at END
    WHERE id = ?
  `).run(quote || evidence.quote, context || evidence.context, 
         verified ?? null, verified ?? 0, req.user.id, verified ?? 0, req.params.id);
  
  createAuditLog({
    interviewId: evidence.interview_id,
    actionType: 'update',
    objectType: 'evidence',
    objectId: req.params.id,
    actor: req.user,
    changeReason: req.body.changeReason || (verified ? '验证证据' : '更新证据'),
    affectedFields: Object.keys(req.body).filter(k => k !== 'changeReason'),
    oldValues: { ...oldValues, quote: oldValues.quote.substring(0, 50) + '...' },
    newValues: { quote: (quote || oldValues.quote).substring(0, 50) + '...', verified }
  });
  
  const updated = db.prepare('SELECT * FROM evidence WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const evidence = db.prepare('SELECT * FROM evidence WHERE id = ?').get(req.params.id);
  if (!evidence) {
    return res.status(404).json({ error: 'Evidence not found' });
  }
  
  db.prepare('DELETE FROM evidence WHERE id = ?').run(req.params.id);
  
  createAuditLog({
    interviewId: evidence.interview_id,
    actionType: 'delete',
    objectType: 'evidence',
    objectId: req.params.id,
    actor: req.user,
    changeReason: req.body.reason || '删除证据',
    oldValues: evidence
  });
  
  res.json({ success: true });
});

module.exports = router;
