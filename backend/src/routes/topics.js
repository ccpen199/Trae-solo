const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', (req, res) => {
  try {
    const { category, is_hot } = req.query;
    let query = 'SELECT * FROM topics WHERE status = \'active\'';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (is_hot !== undefined) {
      query += ' AND is_hot = ?';
      params.push(parseInt(is_hot));
    }

    query += ' ORDER BY sort_order ASC, follow_count DESC';

    const topics = db.prepare(query).all(...params);
    res.json({ code: 0, data: topics, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.post('/', auth, requireRole('admin'), (req, res) => {
  try {
    const { name, slug, description, cover_image, category, is_hot, is_official, sort_order } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ code: 1, message: '话题名称和slug不能为空' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO topics (id, name, slug, description, cover_image, category, is_hot, is_official, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, name, slug, description || null, cover_image || null, category || null, is_hot || 0, is_official || 0, sort_order || 0, now, now);

    const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(id);
    res.json({ code: 0, data: topic, message: '创建成功' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ code: 1, message: '话题名称或slug已存在' });
    }
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.put('/:id', auth, requireRole('admin'), (req, res) => {
  try {
    const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.id);
    if (!topic) {
      return res.status(404).json({ code: 1, message: '话题不存在' });
    }

    const { name, slug, description, cover_image, category, is_hot, is_official, sort_order, status } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE topics SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        description = COALESCE(?, description),
        cover_image = COALESCE(?, cover_image),
        category = COALESCE(?, category),
        is_hot = COALESCE(?, is_hot),
        is_official = COALESCE(?, is_official),
        sort_order = COALESCE(?, sort_order),
        status = COALESCE(?, status),
        updated_at = ?
      WHERE id = ?
    `).run(name || null, slug || null, description || null, cover_image || null, category || null, is_hot !== undefined ? is_hot : null, is_official !== undefined ? is_official : null, sort_order !== undefined ? sort_order : null, status || null, now, req.params.id);

    const updated = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.id);
    res.json({ code: 0, data: updated, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.get('/:id/review-logs', auth, requireRole('admin'), (req, res) => {
  try {
    const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.id);
    if (!topic) {
      return res.status(404).json({ code: 1, message: '话题不存在' });
    }

    const logs = db.prepare(`
      SELECT
        rl.id,
        rl.content_id,
        c.title as content_title,
        COALESCE(u.nickname, u.username, '系统审核') as reviewer,
        rl.action,
        rl.note as comment,
        rl.created_at
      FROM review_logs rl
      JOIN contents c ON rl.content_id = c.id
      LEFT JOIN users u ON rl.reviewer_id = u.id
      WHERE c.topic_ids LIKE ?
      ORDER BY rl.created_at DESC
      LIMIT 50
    `).all(`%${topic.id}%`);

    res.json({ code: 0, data: logs, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.get('/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const topic = db.prepare('SELECT * FROM topics WHERE slug = ?').get(slug);
    if (!topic) {
      return res.status(404).json({ code: 1, message: '话题不存在' });
    }
    res.json({ code: 0, data: topic, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.get('/:slug/contents', (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, pageSize = 20, sort = 'latest' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const topic = db.prepare('SELECT * FROM topics WHERE slug = ?').get(slug);
    if (!topic) {
      return res.status(404).json({ code: 1, message: '话题不存在' });
    }

    let query = `
      SELECT c.*, u.nickname as author_nickname, u.avatar as author_avatar, u.role as author_role,
             u.creator_level as author_level, u.is_certified as author_certified,
             cl.name as author_level_name,
             (c.like_count * 3 + c.view_count * 1 + c.comment_count * 5 + c.collect_count * 2) as hot_score
      FROM contents c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN creator_levels cl ON u.creator_level = cl.id
      WHERE c.status = 'active' AND c.review_status IN ('ai_approved', 'approved') AND c.topic_ids LIKE ?
    `;
    const params = [`%${topic.id}%`];

    if (sort === 'hot') {
      query += ' ORDER BY c.is_pinned DESC, c.is_featured DESC, c.like_count DESC, c.view_count DESC, c.created_at DESC';
    } else {
      query += ' ORDER BY c.created_at DESC';
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const contents = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as cnt FROM contents WHERE status = \'active\' AND review_status IN (\'ai_approved\', \'approved\') AND topic_ids LIKE ?').get(`%${topic.id}%`).cnt;

    res.json({
      code: 0,
      data: { list: contents, topic, total, page: parseInt(page), pageSize: parseInt(pageSize) },
      message: 'ok'
    });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.get('/:slug/stats', (req, res) => {
  try {
    const { slug } = req.params;
    const topic = db.prepare('SELECT * FROM topics WHERE slug = ?').get(slug);
    if (!topic) {
      return res.status(404).json({ code: 1, message: '话题不存在' });
    }

    const topicIdPattern = `%${topic.id}%`;

    const reviewStats = db.prepare(`
      SELECT review_status, COUNT(*) as count
      FROM contents
      WHERE status = 'active' AND topic_ids LIKE ?
      GROUP BY review_status
    `).all(topicIdPattern);

    const reviewSummary = {
      pending: 0,
      ai_approved: 0,
      approved: 0,
      rejected: 0
    };
    reviewStats.forEach(r => {
      if (reviewSummary[r.review_status] !== undefined) {
        reviewSummary[r.review_status] = r.count;
      }
    });

    const levelDistribution = db.prepare(`
      SELECT u.creator_level, cl.name, COUNT(DISTINCT c.user_id) as count
      FROM contents c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN creator_levels cl ON u.creator_level = cl.id
      WHERE c.status = 'active' AND c.review_status IN ('ai_approved', 'approved') AND c.topic_ids LIKE ?
      GROUP BY u.creator_level
      ORDER BY u.creator_level
    `).all(topicIdPattern);

    const totalAuthors = levelDistribution.reduce((sum, l) => sum + l.count, 0);
    const levelsWithPercent = levelDistribution.map(l => ({
      ...l,
      percent: totalAuthors > 0 ? Math.round((l.count / totalAuthors) * 100) : 0
    }));

    const reviewLogs = db.prepare(`
      SELECT rl.*, u.nickname as reviewer_name
      FROM review_logs rl
      JOIN contents c ON rl.content_id = c.id
      LEFT JOIN users u ON rl.reviewer_id = u.id
      WHERE c.topic_ids LIKE ?
      ORDER BY rl.created_at DESC
      LIMIT 20
    `).all(topicIdPattern);

    const hasSensitiveWords = db.prepare(`
      SELECT COUNT(*) as cnt
      FROM contents c
      JOIN review_logs rl ON c.id = rl.content_id
      WHERE c.topic_ids LIKE ? AND rl.action = 'flag'
    `).get(topicIdPattern).cnt > 0;

    res.json({
      code: 0,
      data: {
        review_summary: reviewSummary,
        level_distribution: levelsWithPercent,
        review_logs: reviewLogs,
        has_sensitive_words: hasSensitiveWords
      },
      message: 'ok'
    });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.post('/:id/follow', auth, (req, res) => {
  try {
    const topicId = req.params.id;
    const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(topicId);
    if (!topic) {
      return res.status(404).json({ code: 1, message: '话题不存在' });
    }

    const existing = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_type = \'topic\' AND following_id = ?').get(req.user.id, topicId);

    if (existing) {
      db.prepare('DELETE FROM follows WHERE id = ?').run(existing.id);
      db.prepare('UPDATE topics SET follow_count = follow_count - 1 WHERE id = ?').run(topicId);
      res.json({ code: 0, data: { followed: false }, message: '取消关注' });
    } else {
      const id = uuidv4();
      const now = new Date().toISOString();
      db.prepare('INSERT INTO follows (id, follower_id, following_type, following_id, created_at) VALUES (?, ?, \'topic\', ?, ?)').run(id, req.user.id, topicId, now);
      db.prepare('UPDATE topics SET follow_count = follow_count + 1 WHERE id = ?').run(topicId);
      res.json({ code: 0, data: { followed: true }, message: '关注成功' });
    }
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

module.exports = router;
