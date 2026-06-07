const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/articles', (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  db.all(`
    SELECT a.*, 
           (SELECT COUNT(*) FROM comments c WHERE c.article_id = a.id AND c.status = 'published') as comment_count
    FROM articles a
    WHERE a.status = 'published'
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `, [parseInt(limit), parseInt(offset)], (err, articles) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }
    res.json({ articles });
  });
});

router.get('/articles/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM articles WHERE id = ? AND status = ?', [id, 'published'], (err, article) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }
    if (!article) {
      return res.status(404).json({ error: '文章不存在' });
    }

    db.run('UPDATE articles SET view_count = view_count + 1 WHERE id = ?', [id]);

    res.json({ article });
  });
});

router.post('/articles', authenticateToken, requireAdmin, (req, res) => {
  const { title, content, type, author, coverImage, tags, eventId } = req.body;

  db.run(
    'INSERT INTO articles (title, content, type, author, cover_image, tags, event_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [title, content, type || 'pgc', author, coverImage, tags, eventId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '创建失败' });
      }
      res.status(201).json({ id: this.lastID, message: '创建成功' });
    }
  );
});

router.get('/articles/:id/comments', (req, res) => {
  const { id } = req.params;

  db.all(`
    SELECT c.*, u.username, u.avatar
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.article_id = ? AND c.status = 'published'
    ORDER BY c.created_at DESC
  `, [id], (err, comments) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }
    res.json({ comments });
  });
});

router.post('/articles/:id/comments', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { content, parentId } = req.body;
  const userId = req.user.id;

  db.run(
    'INSERT INTO comments (article_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)',
    [id, userId, content, parentId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '评论失败' });
      }
      res.status(201).json({ id: this.lastID, message: '评论成功' });
    }
  );
});

router.get('/tags', (req, res) => {
  db.all(`
    SELECT tags FROM articles WHERE status = 'published'`, (err, articles) => {
    const allTags = [];
    articles.forEach(a => {
      if (a.tags) {
        allTags.push(...a.tags.split(','));
      }
    });
    const tagCounts = {};
    allTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    const hotTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, count]) => ({ name, count }));
    res.json({ tags: hotTags });
  });
});

module.exports = router;
