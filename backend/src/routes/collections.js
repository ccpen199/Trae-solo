const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, (req, res) => {
  const { item_type } = req.query;
  const userId = req.user.id;

  let query = `
    SELECT uc.*, 
           CASE uc.item_type 
             WHEN 'brand' THEN b.name
             WHEN 'topic' THEN kt.title
             WHEN 'ranking' THEN rc.name
           END as item_title,
           CASE uc.item_type
             WHEN 'brand' THEN b.logo_url
             WHEN 'topic' THEN kt.cover_image
             ELSE NULL
           END as item_image
    FROM user_collections uc
    LEFT JOIN brands b ON uc.item_type = 'brand' AND uc.item_id = b.id
    LEFT JOIN knowledge_topics kt ON uc.item_type = 'topic' AND uc.item_id = kt.id
    LEFT JOIN ranking_categories rc ON uc.item_type = 'ranking' AND uc.item_id = rc.id
    WHERE uc.user_id = ?
  `;
  const params = [userId];

  if (item_type) {
    query += ' AND uc.item_type = ?';
    params.push(item_type);
  }
  query += ' ORDER BY uc.created_at DESC';

  const collections = db.prepare(query).all(...params);
  res.json(collections);
});

router.post('/', authenticateToken, (req, res) => {
  const { item_type, item_id } = req.body;
  const userId = req.user.id;

  if (!item_type || !item_id) {
    return res.status(400).json({ error: 'item_type and item_id are required' });
  }

  if (!['brand', 'topic', 'ranking'].includes(item_type)) {
    return res.status(400).json({ error: 'Invalid item_type' });
  }

  try {
    db.prepare(`
      INSERT INTO user_collections (user_id, item_type, item_id)
      VALUES (?, ?, ?)
    `).run(userId, item_type, item_id);

    res.json({ success: true, message: 'Collection added' });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Already collected' });
    }
    res.status(500).json({ error: error.message });
  }
});

router.delete('/', authenticateToken, (req, res) => {
  const { item_type, item_id } = req.body;
  const userId = req.user.id;

  const info = db.prepare(`
    DELETE FROM user_collections 
    WHERE user_id = ? AND item_type = ? AND item_id = ?
  `).run(userId, item_type, item_id);

  if (info.changes === 0) {
    return res.status(404).json({ error: 'Collection not found' });
  }

  res.json({ success: true, message: 'Collection removed' });
});

router.get('/check', authenticateToken, (req, res) => {
  const { item_type, item_id } = req.query;
  const userId = req.user.id;

  const collection = db.prepare(`
    SELECT id FROM user_collections 
    WHERE user_id = ? AND item_type = ? AND item_id = ?
  `).get(userId, item_type, item_id);

  res.json({ is_collected: !!collection });
});

module.exports = router;
