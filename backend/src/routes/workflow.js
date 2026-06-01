const express = require('express');
const { db } = require('../database');
const { v4: uuidv4 } = require('uuid');
const { createAuditLog } = require('../audit');

const router = express.Router();

router.get('/', (req, res) => {
  const { status, assignee, type } = req.query;
  
  let query = `
    SELECT wt.*, i.title as interview_title, u.name as assignee_name
    FROM workflow_tasks wt
    LEFT JOIN interviews i ON wt.interview_id = i.id
    LEFT JOIN users u ON wt.assignee = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    query += ' AND wt.status = ?';
    params.push(status);
  }
  if (assignee) {
    query += ' AND wt.assignee = ?';
    params.push(assignee);
  }
  if (type) {
    query += ' AND wt.type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY wt.created_at DESC';
  
  const tasks = db.prepare(query).all(...params);
  res.json(tasks);
});

router.get('/:id', (req, res) => {
  const task = db.prepare(`
    SELECT wt.*, i.title as interview_title, u.name as assignee_name
    FROM workflow_tasks wt
    LEFT JOIN interviews i ON wt.interview_id = i.id
    LEFT JOIN users u ON wt.assignee = u.id
    WHERE wt.id = ?
  `).get(req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

router.post('/', (req, res) => {
  const { interview_id, type, title, description, assignee, suggested_action } = req.body;
  
  if (!interview_id || !type || !title) {
    return res.status(400).json({ error: 'Interview ID, type and title are required' });
  }
  
  const id = uuidv4();
  db.prepare(`
    INSERT INTO workflow_tasks (id, interview_id, type, title, description, assignee, suggested_action, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, interview_id, type, title, description || null, assignee || null, suggested_action || null, req.user.id);
  
  const task = db.prepare(`
    SELECT wt.*, u.name as assignee_name
    FROM workflow_tasks wt
    LEFT JOIN users u ON wt.assignee = u.id
    WHERE wt.id = ?
  `).get(id);
  
  createAuditLog({
    interviewId: interview_id,
    actionType: 'create',
    objectType: 'workflow_task',
    objectId: id,
    actor: req.user,
    changeReason: '创建工作流任务',
    affectedFields: ['type', 'title', 'assignee'],
    newValues: { type, title, assignee }
  });
  
  res.status(201).json(task);
});

router.put('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM workflow_tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  const oldValues = { ...task };
  const { status, assignee, resolution, title, description } = req.body;
  
  db.prepare(`
    UPDATE workflow_tasks 
    SET status = COALESCE(?, status), assignee = ?, 
        title = COALESCE(?, title), description = ?,
        resolution = CASE WHEN ? = 'closed' THEN ? ELSE COALESCE(?, resolution) END,
        closed_by = CASE WHEN ? = 'closed' THEN ? ELSE closed_by END,
        closed_at = CASE WHEN ? = 'closed' THEN strftime('%s', 'now') ELSE closed_at END,
        updated_at = strftime('%s', 'now')
    WHERE id = ?
  `).run(status || null, assignee ?? null, title || task.title, description ?? null, 
         status, resolution, resolution, status, req.user.id, status, req.params.id);
  
  const updated = db.prepare(`
    SELECT wt.*, u.name as assignee_name
    FROM workflow_tasks wt
    LEFT JOIN users u ON wt.assignee = u.id
    WHERE wt.id = ?
  `).get(req.params.id);
  
  createAuditLog({
    interviewId: task.interview_id,
    actionType: 'update',
    objectType: 'workflow_task',
    objectId: req.params.id,
    actor: req.user,
    changeReason: req.body.changeReason || (status === 'closed' ? '关闭任务' : '更新任务'),
    affectedFields: Object.keys(req.body).filter(k => k !== 'changeReason'),
    oldValues,
    newValues: { status: status || oldValues.status, assignee }
  });
  
  res.json(updated);
});

router.post('/generate', (req, res) => {
  const { interview_id } = req.body;
  
  if (!interview_id) {
    return res.status(400).json({ error: 'Interview ID is required' });
  }
  
  const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(interview_id);
  if (!interview) {
    return res.status(404).json({ error: 'Interview not found' });
  }
  
  const tasks = [];
  const transcript = db.prepare('SELECT * FROM transcripts WHERE interview_id = ?').get(interview_id);
  
  if (!transcript) {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO workflow_tasks (id, interview_id, type, title, description, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, interview_id, 'missing_transcript', '缺失转写文本', 
           '该访谈尚未生成转写文本，请先上传录音或手动输入转写内容', 'open', req.user.id);
    tasks.push(db.prepare('SELECT * FROM workflow_tasks WHERE id = ?').get(id));
  } else {
    const segments = db.prepare('SELECT * FROM transcript_segments WHERE transcript_id = ?').all(transcript.id);
    const speakerCount = new Set(segments.map(s => s.speaker_id)).size;
    
    if (segments.length > 0 && speakerCount <= 1) {
      const id = uuidv4();
      db.prepare(`
        INSERT INTO workflow_tasks (id, interview_id, type, title, description, suggested_action, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, interview_id, 'speaker_confusion', '说话人识别异常', 
             '所有转写片段只有一个说话人或说话人未分配，请检查并校正说话人标签',
             '检查并重新分配每个转写片段的说话人', 'open', req.user.id);
      tasks.push(db.prepare('SELECT * FROM workflow_tasks WHERE id = ?').get(id));
    }
  }
  
  const painPoints = db.prepare('SELECT * FROM pain_points WHERE interview_id = ?').all(interview_id);
  painPoints.forEach(pp => {
    const evidenceCount = db.prepare('SELECT COUNT(*) as count FROM evidence WHERE pain_point_id = ?').get(pp.id).count;
    if (evidenceCount < 2) {
      const id = uuidv4();
      db.prepare(`
        INSERT INTO workflow_tasks (id, interview_id, type, title, description, suggested_action, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, interview_id, 'insufficient_evidence', `痛点"${pp.title}"证据不足`, 
             `该痛点当前只有 ${evidenceCount} 条证据，建议至少补充到2条以上`,
             '在转写文本中查找更多相关原文引用并添加为证据', 'open', req.user.id);
      tasks.push(db.prepare('SELECT * FROM workflow_tasks WHERE id = ?').get(id));
    }
  });
  
  tasks.forEach(task => {
    createAuditLog({
      interviewId,
      actionType: 'auto_generate',
      objectType: 'workflow_task',
      objectId: task.id,
      actor: req.user,
      changeReason: `系统自动检测生成任务: ${task.type}`,
      affectedFields: ['type', 'title'],
      newValues: { type: task.type, title: task.title }
    });
  });
  
  res.status(201).json({ generated: tasks.length, tasks });
});

module.exports = router;
