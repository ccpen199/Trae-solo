const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { type, category, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM content WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ? OR tags LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const contents = db.prepare(query).all(...params);

    const parsedContents = contents.map(row => ({
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : []
    }));

    const countQuery = 'SELECT COUNT(*) as total FROM content WHERE 1=1';
    const countParams = params.slice(0, -2);
    const countResult = db.prepare(countQuery).get(...countParams);

    res.json({
      success: true,
      data: {
        contents: parsedContents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get contents error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database error',
      error: error.message 
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const content = db.prepare('SELECT * FROM content WHERE id = ?').get(id);

    if (!content) {
      return res.status(404).json({ 
        success: false, 
        message: 'Content not found' 
      });
    }

    content.tags = content.tags ? JSON.parse(content.tags) : [];

    db.prepare('UPDATE content SET view_count = view_count + 1 WHERE id = ?').run(id);

    res.json({
      success: true,
      data: { content }
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database error',
      error: error.message 
    });
  }
});

router.post('/:id/interaction', authenticateToken, (req, res) => {
  try {
    const { id: contentId } = req.params;
    const { interaction_type, view_duration } = req.body;
    const userId = req.user.userId;
    const interactionId = uuidv4();

    const validTypes = ['view', 'like', 'favorite', 'dislike'];
    if (!validTypes.includes(interaction_type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid interaction type' 
      });
    }

    db.prepare(`
      INSERT OR REPLACE INTO user_content_interactions (id, user_id, content_id, interaction_type, view_duration)
      VALUES (?, ?, ?, ?, ?)
    `).run(interactionId, userId, contentId, interaction_type, view_duration || 0);

    if (interaction_type === 'like') {
      db.prepare('UPDATE content SET like_count = like_count + 1 WHERE id = ?').run(contentId);
    } else if (interaction_type === 'favorite') {
      db.prepare('UPDATE content SET favorite_count = favorite_count + 1 WHERE id = ?').run(contentId);
    }

    res.json({
      success: true,
      message: 'Interaction recorded successfully'
    });
  } catch (error) {
    console.error('Interaction error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to record interaction',
      error: error.message 
    });
  }
});

router.get('/recommended', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 10 } = req.query;

    const user = db.prepare('SELECT level FROM users WHERE id = ?').get(userId);

    let contents;
    if (!user) {
      contents = db.prepare('SELECT * FROM content ORDER BY view_count DESC LIMIT ?').all(parseInt(limit));
    } else {
      contents = db.prepare('SELECT * FROM content WHERE difficulty = ? ORDER BY view_count DESC LIMIT ?')
        .all(user.level, parseInt(limit));
    }

    const parsedContents = contents.map(row => ({
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : []
    }));

    res.json({
      success: true,
      data: { contents: parsedContents }
    });
  } catch (error) {
    console.error('Recommended error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database error',
      error: error.message 
    });
  }
});

module.exports = router;
