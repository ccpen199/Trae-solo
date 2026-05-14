const express = require('express');
const db = require('../db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { success, error, notFound, serverError, forbidden } = require('../utils/response');

const router = express.Router();

function containsBlacklist(text) {
  if (!text) return false;
  const blacklist = db.prepare('SELECT word FROM blacklist_words').all();
  return blacklist.some(item => text.includes(item.word));
}

router.get('/', optionalAuth, (req, res) => {
  try {
    const { bar_id, column_id, content_type, page = 1, pageSize = 10, keyword, sort = 'newest' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let whereClause = `WHERE p.status = 'published'`;
    const params = [];

    if (bar_id) {
      whereClause += ` AND p.bar_id = ?`;
      params.push(bar_id);
    }
    if (column_id) {
      whereClause += ` AND p.column_id = ?`;
      params.push(column_id);
    }
    if (content_type) {
      whereClause += ` AND p.content_type = ?`;
      params.push(content_type);
    }
    if (keyword) {
      whereClause += ` AND (p.title LIKE ? OR p.content LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    let orderBy = 'ORDER BY p.is_top DESC, p.created_at DESC';
    if (sort === 'hot') {
      orderBy = 'ORDER BY p.is_top DESC, p.view_count DESC, p.like_count DESC';
    } else if (sort === 'recommend') {
      orderBy = 'ORDER BY p.is_top DESC, p.is_recommended DESC, p.created_at DESC';
    }

    const countQuery = `SELECT COUNT(*) as total FROM posts p ${whereClause}`;
    const { total } = db.prepare(countQuery).get(...params);

    const posts = db.prepare(`
      SELECT p.*, 
             u.nickname as author_nickname, u.avatar as author_avatar,
             c.name as column_name,
             pb.name as bar_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN content_columns c ON p.column_id = c.id
      LEFT JOIN product_bars pb ON p.bar_id = pb.id
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize), offset);

    return success(res, {
      list: posts,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total
      }
    });
  } catch (err) {
    console.error('获取帖子列表错误:', err);
    return serverError(res, '获取列表失败');
  }
});

router.get('/my', authMiddleware, (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let whereClause = `WHERE p.author_id = ?`;
    const params = [req.user.id];

    if (status) {
      whereClause += ` AND p.status = ?`;
      params.push(status);
    }

    const countQuery = `SELECT COUNT(*) as total FROM posts p ${whereClause}`;
    const { total } = db.prepare(countQuery).get(...params);

    const posts = db.prepare(`
      SELECT p.*, 
             pb.name as bar_name,
             c.name as column_name
      FROM posts p
      LEFT JOIN product_bars pb ON p.bar_id = pb.id
      LEFT JOIN content_columns c ON p.column_id = c.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize), offset);

    return success(res, {
      list: posts,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total
      }
    });
  } catch (err) {
    console.error('获取我的帖子错误:', err);
    return serverError(res, '获取失败');
  }
});

router.get('/:id', optionalAuth, (req, res) => {
  try {
    const post = db.prepare(`
      SELECT p.*, 
             u.nickname as author_nickname, u.avatar as author_avatar, u.id as author_id,
             c.name as column_name,
             pb.name as bar_name, pb.id as bar_id
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN content_columns c ON p.column_id = c.id
      LEFT JOIN product_bars pb ON p.bar_id = pb.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!post) {
      return notFound(res, '帖子不存在');
    }

    if (post.status !== 'published') {
      if (!req.user || (req.user.id !== post.author_id && req.user.role !== 'admin' && req.user.role !== 'operator')) {
        return forbidden(res, '该帖子暂不可访问');
      }
    }

    db.prepare('UPDATE posts SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);

    return success(res, post);
  } catch (err) {
    console.error('获取帖子详情错误:', err);
    return serverError(res, '获取详情失败');
  }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const { bar_id, column_id, title, content, content_type = 'forum', source, source_url } = req.body;

    if (!bar_id) {
      return error(res, '请选择产品吧');
    }
    if (!title || !title.trim()) {
      return error(res, '标题不能为空');
    }
    if (!content || !content.trim()) {
      return error(res, '内容不能为空');
    }

    if (title.length > 100) {
      return error(res, '标题不能超过100个字符');
    }

    const bar = db.prepare('SELECT * FROM product_bars WHERE id = ?').get(bar_id);
    if (!bar) {
      return notFound(res, '产品吧不存在');
    }

    if (bar.status !== 'active') {
      return error(res, '该产品吧暂不可发帖');
    }

    if (containsBlacklist(title) || containsBlacklist(content)) {
      return error(res, '内容包含违规词汇，请修改后重试');
    }

    const isMember = db.prepare('SELECT id FROM bar_members WHERE bar_id = ? AND user_id = ?').get(bar_id, req.user.id);
    if (!isMember) {
      return error(res, '请先加入该产品吧');
    }

    const tx = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO posts (bar_id, column_id, author_id, title, content, content_type, source, source_url, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `).run(bar_id, column_id || null, req.user.id, title.trim(), content.trim(), content_type, source || null, source_url || null);

      const postId = result.lastInsertRowid;

      db.prepare(`
        INSERT INTO reviews (target_type, target_id, submitter_id, review_type, reason)
        VALUES ('post', ?, ?, 'creation', '新帖子待审核')
      `).run(postId, req.user.id);

      return postId;
    });

    const postId = tx();

    return success(res, { id: postId }, '帖子发布成功，等待审核');
  } catch (err) {
    console.error('创建帖子错误:', err);
    return serverError(res, '发布失败，请稍后重试');
  }
});

router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { title, content, column_id, source, source_url } = req.body;

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    if (!post) {
      return notFound(res, '帖子不存在');
    }

    if (post.author_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'operator') {
      return forbidden(res, '无权修改此帖子');
    }

    const updates = [];
    const values = [];

    if (title !== undefined) {
      if (!title.trim()) {
        return error(res, '标题不能为空');
      }
      if (title.length > 100) {
        return error(res, '标题不能超过100个字符');
      }
      updates.push('title = ?');
      values.push(title.trim());
    }
    if (content !== undefined) {
      if (!content.trim()) {
        return error(res, '内容不能为空');
      }
      updates.push('content = ?');
      values.push(content.trim());
    }
    if (column_id !== undefined) {
      updates.push('column_id = ?');
      values.push(column_id);
    }
    if (source !== undefined) {
      updates.push('source = ?');
      values.push(source);
    }
    if (source_url !== undefined) {
      updates.push('source_url = ?');
      values.push(source_url);
    }

    if (updates.length === 0) {
      return success(res, null, '无需更新');
    }

    if (updates.some(u => u.includes('title') || u.includes('content'))) {
      const checkContent = (title || post.title) + (content || post.content);
      if (containsBlacklist(checkContent)) {
        return error(res, '内容包含违规词汇，请修改后重试');
      }
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    updates.push('status = ?');
    values.push('pending');
    values.push(req.params.id);

    db.prepare(`UPDATE posts SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    db.prepare(`
      INSERT INTO reviews (target_type, target_id, submitter_id, review_type, reason)
      VALUES ('post', ?, ?, 'update', '帖子修改后待审核')
    `).run(req.params.id, req.user.id);

    return success(res, null, '更新成功，等待审核');
  } catch (err) {
    console.error('更新帖子错误:', err);
    return serverError(res, '更新失败');
  }
});

router.post('/:id/like', authMiddleware, (req, res) => {
  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    if (!post) {
      return notFound(res, '帖子不存在');
    }

    if (post.status !== 'published') {
      return error(res, '该帖子暂不可点赞');
    }

    db.prepare('UPDATE posts SET like_count = like_count + 1 WHERE id = ?').run(req.params.id);

    return success(res, null, '点赞成功');
  } catch (err) {
    console.error('点赞错误:', err);
    return serverError(res, '操作失败');
  }
});

router.get('/:postId/comments', optionalAuth, (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const countQuery = `
      SELECT COUNT(*) as total FROM comments 
      WHERE post_id = ? AND status = 'published' AND parent_id IS NULL
    `;
    const { total } = db.prepare(countQuery).get(req.params.postId);

    const comments = db.prepare(`
      SELECT c.*, 
             u.nickname as user_nickname, u.avatar as user_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ? AND c.status = 'published' AND c.parent_id IS NULL
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.params.postId, parseInt(pageSize), offset);

    return success(res, {
      list: comments,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total
      }
    });
  } catch (err) {
    console.error('获取评论错误:', err);
    return serverError(res, '获取失败');
  }
});

router.post('/:postId/comments', authMiddleware, (req, res) => {
  try {
    const { content, parent_id } = req.body;

    if (!content || !content.trim()) {
      return error(res, '评论内容不能为空');
    }

    if (content.length > 500) {
      return error(res, '评论不能超过500个字符');
    }

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.postId);
    if (!post) {
      return notFound(res, '帖子不存在');
    }

    if (post.status !== 'published') {
      return error(res, '该帖子暂不可评论');
    }

    if (containsBlacklist(content)) {
      return error(res, '评论包含违规词汇');
    }

    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO comments (post_id, user_id, parent_id, content)
        VALUES (?, ?, ?, ?)
      `).run(req.params.postId, req.user.id, parent_id || null, content.trim());

      db.prepare('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?').run(req.params.postId);
    });

    tx();

    return success(res, null, '评论成功');
  } catch (err) {
    console.error('评论错误:', err);
    return serverError(res, '评论失败');
  }
});

module.exports = router;
