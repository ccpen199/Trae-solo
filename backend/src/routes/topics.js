const express = require('express');
const { db } = require('../database');
const { v4: uuidv4 } = require('uuid');
const { createAuditLog } = require('../audit');

const router = express.Router({ mergeParams: true });

router.get('/', (req, res) => {
  const topics = db.prepare(`
    SELECT * FROM topics WHERE interview_id = ? ORDER BY created_at DESC
  `).all(req.params.interviewId);
  res.json(topics);
});

router.post('/', (req, res) => {
  const { name, description, keywords, cluster_id, sentiment } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Topic name is required' });
  }
  
  const id = uuidv4();
  db.prepare(`
    INSERT INTO topics (id, interview_id, name, description, keywords, cluster_id, sentiment, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.interviewId, name, description || null, keywords || null, cluster_id || null, sentiment || null, req.user.id);
  
  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(id);
  
  createAuditLog({
    interviewId: req.params.interviewId,
    actionType: 'create',
    objectType: 'topic',
    objectId: id,
    actor: req.user,
    changeReason: '添加主题',
    affectedFields: ['name', 'description', 'sentiment'],
    newValues: { name, description, sentiment }
  });
  
  res.status(201).json(topic);
});

router.put('/:id', (req, res) => {
  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.id);
  if (!topic) {
    return res.status(404).json({ error: 'Topic not found' });
  }
  
  const oldValues = { ...topic };
  const { name, description, keywords, cluster_id, sentiment } = req.body;
  
  db.prepare(`
    UPDATE topics 
    SET name = ?, description = ?, keywords = ?, cluster_id = ?, sentiment = ?, updated_at = strftime('%s', 'now')
    WHERE id = ?
  `).run(name || topic.name, description || topic.description, keywords || topic.keywords, cluster_id ?? topic.cluster_id, sentiment || topic.sentiment, req.params.id);
  
  createAuditLog({
    interviewId: topic.interview_id,
    actionType: 'update',
    objectType: 'topic',
    objectId: req.params.id,
    actor: req.user,
    changeReason: req.body.changeReason || '更新主题',
    affectedFields: Object.keys(req.body).filter(k => k !== 'changeReason'),
    oldValues,
    newValues: { name: name || oldValues.name, sentiment: sentiment || oldValues.sentiment }
  });
  
  const updated = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.id);
  if (!topic) {
    return res.status(404).json({ error: 'Topic not found' });
  }
  
  db.prepare('DELETE FROM topics WHERE id = ?').run(req.params.id);
  
  createAuditLog({
    interviewId: topic.interview_id,
    actionType: 'delete',
    objectType: 'topic',
    objectId: req.params.id,
    actor: req.user,
    changeReason: req.body.reason || '删除主题',
    oldValues: topic
  });
  
  res.json({ success: true });
});

router.post('/cluster', (req, res) => {
  const { topics } = req.body;
  
  if (!topics || !Array.isArray(topics)) {
    return res.status(400).json({ error: 'Invalid topics data' });
  }
  
  const interviewId = req.params.interviewId;
  const results = [];
  
  topics.forEach(topicData => {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO topics (id, interview_id, name, description, keywords, cluster_id, sentiment, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, interviewId, topicData.name, topicData.description || null, 
           topicData.keywords?.join(',') || null, topicData.cluster_id || null, 
           topicData.sentiment || 'neutral', req.user.id);
    
    results.push(db.prepare('SELECT * FROM topics WHERE id = ?').get(id));
  });
  
  db.prepare(`
    UPDATE interviews SET status = 'clustering', updated_at = strftime('%s', 'now')
    WHERE id = ?
  `).run(interviewId);
  
  createAuditLog({
    interviewId,
    actionType: 'cluster',
    objectType: 'topics',
    objectId: interviewId,
    actor: req.user,
    changeReason: '主题聚类分析',
    affectedFields: ['topics'],
    newValues: { count: results.length }
  });
  
  res.status(201).json(results);
});

module.exports = router;
