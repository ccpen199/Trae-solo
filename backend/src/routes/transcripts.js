const express = require('express');
const { db } = require('../database');
const { v4: uuidv4 } = require('uuid');
const { createAuditLog } = require('../audit');

const router = express.Router({ mergeParams: true });

router.get('/', (req, res) => {
  const transcripts = db.prepare(`
    SELECT * FROM transcripts WHERE interview_id = ?
  `).all(req.params.interviewId);
  res.json(transcripts);
});

router.post('/', (req, res) => {
  const { content, language, segments } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Transcript content is required' });
  }
  
  const id = uuidv4();
  const interviewId = req.params.interviewId;
  
  const stmt = db.prepare(`
    INSERT INTO transcripts (id, interview_id, content, language, confidence, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, interviewId, content, language || 'zh-CN', 0.95, req.user.id);
  
  if (segments && Array.isArray(segments)) {
    const insertSegment = db.prepare(`
      INSERT INTO transcript_segments (id, transcript_id, speaker_id, start_time, end_time, text, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    segments.forEach(seg => {
      insertSegment.run(uuidv4(), id, seg.speaker_id || null, seg.start_time || 0, seg.end_time || 0, seg.text, seg.confidence || null);
    });
  }
  
  db.prepare(`
    UPDATE interviews SET status = 'transcribed', updated_at = strftime('%s', 'now')
    WHERE id = ?
  `).run(interviewId);
  
  createAuditLog({
    interviewId,
    actionType: 'create',
    objectType: 'transcript',
    objectId: id,
    actor: req.user,
    changeReason: '创建转写文本',
    affectedFields: ['content', 'language'],
    newValues: { content: content.substring(0, 100) + '...' }
  });
  
  const transcript = db.prepare('SELECT * FROM transcripts WHERE id = ?').get(id);
  const savedSegments = db.prepare('SELECT * FROM transcript_segments WHERE transcript_id = ?').all(id);
  
  res.status(201).json({ ...transcript, segments: savedSegments });
});

router.put('/:id', (req, res) => {
  const transcript = db.prepare('SELECT * FROM transcripts WHERE id = ?').get(req.params.id);
  if (!transcript) {
    return res.status(404).json({ error: 'Transcript not found' });
  }
  
  const oldValues = { ...transcript };
  const { content, language } = req.body;
  
  db.prepare(`
    UPDATE transcripts 
    SET content = ?, language = ?, updated_at = strftime('%s', 'now'), version = version + 1
    WHERE id = ?
  `).run(content || transcript.content, language || transcript.language, req.params.id);
  
  createAuditLog({
    interviewId: transcript.interview_id,
    actionType: 'update',
    objectType: 'transcript',
    objectId: req.params.id,
    actor: req.user,
    changeReason: req.body.changeReason || '更新转写文本',
    affectedFields: Object.keys(req.body).filter(k => k !== 'changeReason'),
    oldValues: { ...oldValues, content: oldValues.content.substring(0, 100) + '...' },
    newValues: { content: (content || oldValues.content).substring(0, 100) + '...' }
  });
  
  const updated = db.prepare('SELECT * FROM transcripts WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.post('/:id/segments', (req, res) => {
  const { start_time, end_time, text, speaker_id } = req.body;
  
  const id = uuidv4();
  db.prepare(`
    INSERT INTO transcript_segments (id, transcript_id, speaker_id, start_time, end_time, text)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, speaker_id || null, start_time, end_time, text);
  
  const segment = db.prepare('SELECT * FROM transcript_segments WHERE id = ?').get(id);
  res.status(201).json(segment);
});

router.put('/segments/:id', (req, res) => {
  const segment = db.prepare('SELECT * FROM transcript_segments WHERE id = ?').get(req.params.id);
  if (!segment) {
    return res.status(404).json({ error: 'Segment not found' });
  }
  
  const { text, speaker_id, start_time, end_time } = req.body;
  
  db.prepare(`
    UPDATE transcript_segments 
    SET text = ?, speaker_id = ?, start_time = ?, end_time = ?
    WHERE id = ?
  `).run(text || segment.text, speaker_id || segment.speaker_id, start_time ?? segment.start_time, end_time ?? segment.end_time, req.params.id);
  
  const updated = db.prepare('SELECT * FROM transcript_segments WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
