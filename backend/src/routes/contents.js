const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { auth } = require('../middleware/auth');
const { aiReview } = require('../utils/review');
const { getRecommendedContent } = require('../utils/recommendation');

router.post('/', auth, (req, res) => {
  try {
    const { title, body, content_type, summary, cover_image, media_urls, topic_ids, city, tags, status } = req.body;

    if (!body) {
      return res.status(400).json({ code: 1, message: '内容不能为空' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const finalStatus = status === 'draft' ? 'draft' : 'active';

    db.prepare(
      `INSERT INTO contents (id, user_id, title, body, content_type, summary, cover_image, media_urls, topic_ids, city, tags, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, req.user.id, title || null, body, content_type || 'note',
      summary || null, cover_image || null,
      JSON.stringify(media_urls || []),
      JSON.stringify(topic_ids || []),
      city || null,
      JSON.stringify(tags || []),
      finalStatus, now, now
    );

    if (topic_ids && topic_ids.length > 0) {
      const topicIds = Array.isArray(topic_ids) ? topic_ids : JSON.parse(topic_ids || '[]');
      for (const tid of topicIds) {
        db.prepare('UPDATE topics SET post_count = post_count + 1 WHERE id = ?').run(tid);
      }
    }

    db.prepare('UPDATE users SET content_count = content_count + 1 WHERE id = ?').run(req.user.id);

    if (finalStatus === 'active') {
      aiReview(id, title, body);
    }

    const content = db.prepare('SELECT * FROM contents WHERE id = ?').get(id);
    res.json({ code: 0, data: content, message: '创建成功' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.get('/', (req, res) => {
  try {
    const { page = 1, pageSize = 20, topic, city, content_type, sort = 'latest', search, q, following, recommend } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const searchQuery = q || search;

    let currentUserId = null;
    if (req.headers.authorization) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'citylife-secret-key-2024');
        currentUserId = decoded.id;
      } catch (e) {}
    }

    let query = `
      SELECT c.*, u.nickname as author_nickname, u.avatar as author_avatar, u.role as author_role,
             u.creator_level as author_level, u.is_certified as author_certified,
             cl.name as author_level_name,
             (c.like_count * 3 + c.view_count * 1 + c.comment_count * 5 + c.collect_count * 2) as hot_score
      FROM contents c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN creator_levels cl ON u.creator_level = cl.id
      WHERE c.status = 'active' AND c.review_status IN ('ai_approved', 'approved')
    `;
    const params = [];

    if (following && currentUserId) {
      const followedUsers = db.prepare(
        "SELECT following_id FROM follows WHERE follower_id = ? AND following_type = 'user'"
      ).all(currentUserId).map(r => r.following_id);

      const followedTopics = db.prepare(
        "SELECT following_id FROM follows WHERE follower_id = ? AND following_type = 'topic'"
      ).all(currentUserId).map(r => r.following_id);

      if (followedUsers.length > 0 || followedTopics.length > 0) {
        const placeholders = followedUsers.map(() => '?').join(',');
        const topicConditions = followedTopics.map(() => 'c.topic_ids LIKE ?').join(' OR ');
        
        if (followedUsers.length > 0 && followedTopics.length > 0) {
          query += ` AND (c.user_id IN (${placeholders})`;
          params.push(...followedUsers);
          query += ` OR ${topicConditions})`;
          followedTopics.forEach(t => params.push(`%${t}%`));
        } else if (followedUsers.length > 0) {
          query += ` AND c.user_id IN (${placeholders})`;
          params.push(...followedUsers);
        } else {
          query += ` AND (${topicConditions})`;
          followedTopics.forEach(t => params.push(`%${t}%`));
        }
      } else {
        query += ' AND 1=0';
      }
    }

    if (recommend && currentUserId) {
      const recommended = getRecommendedContent(currentUserId, parseInt(pageSize), offset);
      const total = db.prepare("SELECT COUNT(*) as total FROM contents WHERE status = 'active' AND review_status IN ('ai_approved', 'approved')").get().total;
      
      return res.json({
        code: 0,
        data: {
          list: recommended,
          total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(total / parseInt(pageSize))
        },
        message: 'ok'
      });
    }

    if (topic) {
      query += ' AND c.topic_ids LIKE ?';
      params.push(`%${topic}%`);
    }
    if (city) {
      query += ' AND c.city = ?';
      params.push(city);
    }
    if (content_type) {
      query += ' AND c.content_type = ?';
      params.push(content_type);
    }
    if (searchQuery) {
      query += ' AND (c.title LIKE ? OR c.body LIKE ? OR c.tags LIKE ?)';
      params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
    }

    const countQuery = query
      .replace(/^[\s\S]*?FROM contents c/, 'SELECT COUNT(*) as total FROM contents c')
      .replace(/\s+LEFT JOIN creator_levels cl ON u\.creator_level = cl\.id/, '');
    const countResult = db.prepare(countQuery).get(...params) || { total: 0 };
    const total = countResult.total || 0;

    if (sort === 'hot') {
      query += ' ORDER BY c.is_pinned DESC, c.is_featured DESC, hot_score DESC, c.created_at DESC';
    } else if (sort === 'most_liked') {
      query += ' ORDER BY c.like_count DESC, c.created_at DESC';
    } else {
      query += ' ORDER BY c.created_at DESC';
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    let contents = db.prepare(query).all(...params);

    if (currentUserId) {
      contents = contents.map(c => {
        const isFollowing = db.prepare(
          "SELECT 1 FROM follows WHERE follower_id = ? AND following_type = 'user' AND following_id = ?"
        ).get(currentUserId, c.user_id);
        return { ...c, is_following_author: !!isFollowing };
      });
    }

    res.json({
      code: 0,
      data: {
        list: contents,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / parseInt(pageSize))
      },
      message: 'ok'
    });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.get('/city/:city/stats', (req, res) => {
  try {
    const { city } = req.params;

    const totalContents = db.prepare(
      "SELECT COUNT(*) as cnt FROM contents WHERE status = 'active' AND review_status IN ('ai_approved', 'approved') AND city = ?"
    ).get(city).cnt;

    const topicStats = db.prepare(`
      SELECT t.id, t.name, t.slug, COUNT(c.id) as content_count
      FROM topics t
      LEFT JOIN contents c ON c.topic_ids LIKE '%' || t.id || '%' AND c.status = 'active' AND c.review_status IN ('ai_approved', 'approved') AND c.city = ?
      WHERE t.status = 'active'
      GROUP BY t.id
      HAVING content_count > 0
      ORDER BY content_count DESC
      LIMIT 10
    `).all(city);

    const totalTopics = topicStats.length;

    const recentActivity = db.prepare(`
      SELECT SUM(like_count) as total_likes, SUM(comment_count) as total_comments, SUM(view_count) as total_views
      FROM contents
      WHERE status = 'active' AND review_status IN ('ai_approved', 'approved') AND city = ?
    `).get(city);

    const topAuthors = db.prepare(`
      SELECT u.id, u.nickname, u.avatar, COUNT(c.id) as content_count, SUM(c.like_count) as total_likes
      FROM users u
      JOIN contents c ON u.id = c.user_id
      WHERE c.city = ? AND c.status = 'active' AND c.review_status IN ('ai_approved', 'approved')
      GROUP BY u.id
      ORDER BY content_count DESC
      LIMIT 5
    `).all(city);

    res.json({
      code: 0,
      data: {
        city,
        total_contents: totalContents,
        total_topics: totalTopics,
        topic_stats: topicStats,
        total_likes: recentActivity.total_likes || 0,
        total_comments: recentActivity.total_comments || 0,
        total_views: recentActivity.total_views || 0,
        top_authors: topAuthors
      },
      message: 'ok'
    });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const content = db.prepare(`
      SELECT c.*, u.nickname as author_nickname, u.avatar as author_avatar, u.role as author_role, u.bio as author_bio, u.is_certified as author_certified
      FROM contents c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!content || content.status === 'deleted') {
      return res.status(404).json({ code: 1, message: '内容不存在' });
    }

    db.prepare('UPDATE contents SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);

    content.view_count += 1;

    let isLiked = false;
    let isCollected = false;
    if (req.user) {
      const like = db.prepare('SELECT id FROM likes WHERE user_id = ? AND target_type = \'content\' AND target_id = ?').get(req.user.id, req.params.id);
      isLiked = !!like;
      const collect = db.prepare('SELECT id FROM collection_items WHERE content_id = ? AND collection_id IN (SELECT id FROM collections WHERE user_id = ?)').get(req.params.id, req.user.id);
      isCollected = !!collect;
    }

    res.json({ code: 0, data: { ...content, isLiked, isCollected }, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.put('/:id', auth, (req, res) => {
  try {
    const content = db.prepare('SELECT * FROM contents WHERE id = ?').get(req.params.id);
    if (!content) {
      return res.status(404).json({ code: 1, message: '内容不存在' });
    }
    if (content.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ code: 1, message: '无权修改' });
    }

    const { title, body, content_type, summary, cover_image, media_urls, topic_ids, city, tags, status } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE contents SET
        title = COALESCE(?, title),
        body = COALESCE(?, body),
        content_type = COALESCE(?, content_type),
        summary = COALESCE(?, summary),
        cover_image = COALESCE(?, cover_image),
        media_urls = COALESCE(?, media_urls),
        topic_ids = COALESCE(?, topic_ids),
        city = COALESCE(?, city),
        tags = COALESCE(?, tags),
        status = COALESCE(?, status),
        updated_at = ?
      WHERE id = ?
    `).run(
      title || null, body || null, content_type || null, summary || null,
      cover_image || null,
      media_urls ? JSON.stringify(media_urls) : null,
      topic_ids ? JSON.stringify(topic_ids) : null,
      city || null,
      tags ? JSON.stringify(tags) : null,
      status || null,
      now, req.params.id
    );

    if (body && status !== 'draft') {
      aiReview(req.params.id, title, body);
    }

    const updated = db.prepare('SELECT * FROM contents WHERE id = ?').get(req.params.id);
    res.json({ code: 0, data: updated, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.delete('/:id', auth, (req, res) => {
  try {
    const content = db.prepare('SELECT * FROM contents WHERE id = ?').get(req.params.id);
    if (!content) {
      return res.status(404).json({ code: 1, message: '内容不存在' });
    }
    if (content.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ code: 1, message: '无权删除' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE contents SET status = \'deleted\', updated_at = ? WHERE id = ?').run(now, req.params.id);

    db.prepare('UPDATE users SET content_count = content_count - 1 WHERE id = ?').run(content.user_id);

    res.json({ code: 0, data: null, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.post('/:id/like', auth, (req, res) => {
  try {
    const contentId = req.params.id;
    const content = db.prepare('SELECT * FROM contents WHERE id = ?').get(contentId);
    if (!content) {
      return res.status(404).json({ code: 1, message: '内容不存在' });
    }

    const existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND target_type = \'content\' AND target_id = ?').get(req.user.id, contentId);

    if (existing) {
      db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
      db.prepare('UPDATE contents SET like_count = like_count - 1 WHERE id = ?').run(contentId);
      db.prepare('UPDATE users SET like_count = like_count - 1 WHERE id = ?').run(content.user_id);
      res.json({ code: 0, data: { liked: false }, message: '取消点赞' });
    } else {
      const id = uuidv4();
      const now = new Date().toISOString();
      db.prepare('INSERT INTO likes (id, user_id, target_type, target_id, created_at) VALUES (?, ?, \'content\', ?, ?)').run(id, req.user.id, contentId, now);
      db.prepare('UPDATE contents SET like_count = like_count + 1 WHERE id = ?').run(contentId);
      db.prepare('UPDATE users SET like_count = like_count + 1 WHERE id = ?').run(content.user_id);
      res.json({ code: 0, data: { liked: true }, message: '点赞成功' });
    }
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.post('/:id/collect', auth, (req, res) => {
  try {
    const contentId = req.params.id;
    const { collection_id } = req.body;
    const content = db.prepare('SELECT * FROM contents WHERE id = ?').get(contentId);
    if (!content) {
      return res.status(404).json({ code: 1, message: '内容不存在' });
    }

    const existing = db.prepare('SELECT id FROM collection_items WHERE collection_id = ? AND content_id = ?').get(collection_id || 'none', contentId);

    if (existing) {
      db.prepare('DELETE FROM collection_items WHERE id = ?').run(existing.id);
      db.prepare('UPDATE contents SET collect_count = collect_count - 1 WHERE id = ?').run(contentId);
      db.prepare('UPDATE collections SET content_count = content_count - 1 WHERE id = ?').run(existing.collection_id || collection_id);
      res.json({ code: 0, data: { collected: false }, message: '取消收藏' });
    } else {
      if (!collection_id) {
        return res.status(400).json({ code: 1, message: '请指定收藏夹' });
      }
      const coll = db.prepare('SELECT * FROM collections WHERE id = ? AND user_id = ?').get(collection_id, req.user.id);
      if (!coll) {
        return res.status(404).json({ code: 1, message: '收藏夹不存在' });
      }
      const id = uuidv4();
      const now = new Date().toISOString();
      db.prepare('INSERT INTO collection_items (id, collection_id, content_id, created_at) VALUES (?, ?, ?, ?)').run(id, collection_id, contentId, now);
      db.prepare('UPDATE contents SET collect_count = collect_count + 1 WHERE id = ?').run(contentId);
      db.prepare('UPDATE collections SET content_count = content_count + 1 WHERE id = ?').run(collection_id);
      res.json({ code: 0, data: { collected: true }, message: '收藏成功' });
    }
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

module.exports = router;
