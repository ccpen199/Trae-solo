const { db } = require('../models/database');

const getCategories = (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM community_categories ORDER BY sort_order').all();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get community categories error:', error);
    res.status(500).json({ success: false, message: '获取分类失败' });
  }
};

const getPosts = (req, res) => {
  try {
    const { categoryId, page = 1, pageSize = 10, isElite } = req.query;
    const offset = (page - 1) * pageSize;

    let query = `
      SELECT p.*, u.nickname, u.avatar, c.name as category_name
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      JOIN community_categories c ON p.category_id = c.id
      WHERE p.status = ?
    `;
    const params = ['approved'];

    if (categoryId) {
      query += ' AND p.category_id = ?';
      params.push(categoryId);
    }

    if (isElite === 'true') {
      query += ' AND p.is_elite = 1';
    }

    const countQuery = query.replace('SELECT p.*, u.nickname, u.avatar, c.name as category_name', 'SELECT COUNT(*) as count');
    const total = db.prepare(countQuery).get(...params).count;

    query += ' ORDER BY p.is_elite DESC, p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const posts = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: {
        list: posts,
        pagination: { total, page: parseInt(page), pageSize: parseInt(pageSize) }
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ success: false, message: '获取帖子列表失败' });
  }
};

const getPostDetail = (req, res) => {
  try {
    const { id } = req.params;

    const post = db.prepare(`
      SELECT p.*, u.nickname, u.avatar, c.name as category_name
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      JOIN community_categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(id);

    if (!post) {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }

    db.prepare('UPDATE community_posts SET view_count = view_count + 1 WHERE id = ?').run(id);

    const replies = db.prepare(`
      SELECT r.*, u.nickname, u.avatar
      FROM post_replies r
      JOIN users u ON r.user_id = u.id
      WHERE r.post_id = ?
      ORDER BY r.created_at ASC
    `).all(id);

    res.json({
      success: true,
      data: {
        post: { ...post, view_count: post.view_count + 1 },
        replies
      }
    });
  } catch (error) {
    console.error('Get post detail error:', error);
    res.status(500).json({ success: false, message: '获取帖子详情失败' });
  }
};

const createPost = (req, res) => {
  try {
    const userId = req.user.userId;
    const { categoryId, title, content } = req.body;

    if (!title || !categoryId) {
      return res.status(400).json({ success: false, message: '请填写完整信息' });
    }

    const result = db.prepare(`
      INSERT INTO community_posts (user_id, category_id, title, content, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, categoryId, title, content || '', 'approved');

    db.prepare('UPDATE users SET active_score = active_score + 5 WHERE id = ?').run(userId);

    res.json({ success: true, message: '发布成功', data: { id: result.lastInsertRowid } });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, message: '发布失败' });
  }
};

const createReply = (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId, content, parentId } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: '请输入回复内容' });
    }

    db.prepare(`
      INSERT INTO post_replies (post_id, user_id, content, parent_id)
      VALUES (?, ?, ?, ?)
    `).run(postId, userId, content, parentId || null);

    db.prepare('UPDATE community_posts SET reply_count = reply_count + 1 WHERE id = ?').run(postId);
    db.prepare('UPDATE users SET active_score = active_score + 2 WHERE id = ?').run(userId);

    res.json({ success: true, message: '回复成功' });
  } catch (error) {
    console.error('Create reply error:', error);
    res.status(500).json({ success: false, message: '回复失败' });
  }
};

const likePost = (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId } = req.body;

    const existing = db.prepare('SELECT * FROM post_likes WHERE user_id = ? AND post_id = ?').get(userId, postId);
    
    if (existing) {
      db.prepare('DELETE FROM post_likes WHERE id = ?').run(existing.id);
      db.prepare('UPDATE community_posts SET like_count = like_count - 1 WHERE id = ?').run(postId);
      res.json({ success: true, message: '取消点赞', data: { liked: false } });
    } else {
      db.prepare('INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)').run(userId, postId);
      db.prepare('UPDATE community_posts SET like_count = like_count + 1 WHERE id = ?').run(postId);
      res.json({ success: true, message: '点赞成功', data: { liked: true } });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
};

const getMyPosts = (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const total = db.prepare('SELECT COUNT(*) as count FROM community_posts WHERE user_id = ?').get(userId).count;

    const posts = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM community_posts p
      JOIN community_categories c ON p.category_id = c.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, parseInt(pageSize), offset);

    res.json({
      success: true,
      data: {
        list: posts,
        pagination: { total, page: parseInt(page), pageSize: parseInt(pageSize) }
      }
    });
  } catch (error) {
    console.error('Get my posts error:', error);
    res.status(500).json({ success: false, message: '获取我的帖子失败' });
  }
};

module.exports = {
  getCategories,
  getPosts,
  getPostDetail,
  createPost,
  createReply,
  likePost,
  getMyPosts
};
