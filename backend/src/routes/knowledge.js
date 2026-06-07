const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const knowledgeGraph = require('../engines/knowledgeGraph');

router.get('/', (req, res) => {
  const { category, search, page = 1, limit = 20 } = req.query;
  
  let query = 'SELECT * FROM knowledge_topics WHERE 1=1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (search) {
    query += ' AND (title LIKE ? OR summary LIKE ? OR content LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
  const total = db.prepare(countQuery).get(...params).count;

  query += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  const topics = db.prepare(query).all(...params);

  res.json({
    data: topics,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM knowledge_topics ORDER BY category').all();
  res.json(categories.map(c => c.category));
});

router.get('/:id', (req, res) => {
  const topic = db.prepare('SELECT * FROM knowledge_topics WHERE id = ?').get(req.params.id);
  if (!topic) {
    return res.status(404).json({ error: 'Topic not found' });
  }

  db.prepare('UPDATE knowledge_topics SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);
  topic.view_count += 1;

  const entities = db.prepare(`
    SELECT ke.* FROM knowledge_entities ke 
    WHERE ke.topic_id = ?
  `).all(req.params.id);

  const relations = db.prepare(`
    SELECT kr.*, se.entity_name as source_name, te.entity_name as target_name
    FROM knowledge_relations kr
    JOIN knowledge_entities se ON kr.source_entity_id = se.id
    JOIN knowledge_entities te ON kr.target_entity_id = te.id
    WHERE se.topic_id = ?
  `).all(req.params.id);

  topic.entities = entities;
  topic.relations = relations;

  res.json(topic);
});

router.post('/', requireAdmin, (req, res) => {
  const { title, summary, content, category, tags, author } = req.body;
  
  const info = db.prepare(`
    INSERT INTO knowledge_topics (title, summary, content, category, tags, author, published_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(title, summary, content, category, tags, author);

  knowledgeGraph.buildTopicGraph(info.lastInsertRowid);

  res.json({ id: info.lastInsertRowid, success: true });
});

router.put('/:id', requireAdmin, (req, res) => {
  const fields = ['title', 'summary', 'content', 'category', 'tags', 'author'];
  const updates = [];
  const values = [];

  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  });

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.params.id);

  db.prepare(`UPDATE knowledge_topics SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  
  if (req.body.content || req.body.summary) {
    knowledgeGraph.buildTopicGraph(parseInt(req.params.id));
  }

  res.json({ success: true });
});

router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM knowledge_topics WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/:id/like', authenticateToken, (req, res) => {
  db.prepare('UPDATE knowledge_topics SET like_count = like_count + 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/:id/graph', (req, res) => {
  const graph = knowledgeGraph.getGraphData(parseInt(req.params.id));
  res.json(graph);
});

router.get('/graph/global', (req, res) => {
  const graph = knowledgeGraph.getGraphData();
  res.json(graph);
});

router.get('/concept/hierarchy', (req, res) => {
  const { parent_id } = req.query;
  const hierarchy = knowledgeGraph.getConceptHierarchy(parent_id ? parseInt(parent_id) : null);
  res.json(hierarchy);
});

router.get('/alerts', (req, res) => {
  const { is_processed } = req.query;
  let query = 'SELECT * FROM update_alerts';
  const params = [];

  if (is_processed !== undefined) {
    query += ' WHERE is_processed = ?';
    params.push(is_processed ? 1 : 0);
  }
  query += ' ORDER BY created_at DESC LIMIT 50';

  const alerts = db.prepare(query).all(...params);
  res.json(alerts);
});

router.put('/alerts/:id/process', requireAdmin, (req, res) => {
  db.prepare('UPDATE update_alerts SET is_processed = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
