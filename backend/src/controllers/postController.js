const { getDB } = require('../models/db');

async function createPost(req, res) {
  try {
    const { title, content, images, category = 'share' } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: '请输入帖子标题' });
    }

    const db = getDB();
    const result = db.prepare(`
      INSERT INTO posts (user_id, title, content, images, category)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      title,
      content || '',
      images ? JSON.stringify(images) : null,
      category
    );

    const post = db.prepare(`
      SELECT p.*, u.nickname, u.avatar
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(result.lastInsertRowid);

    res.json({
      success: true,
      message: '帖子发布成功',
      post: {
        ...post,
        images: post.images ? JSON.parse(post.images) : []
      }
    });
  } catch (error) {
    console.error('发布帖子失败:', error);
    res.status(500).json({ success: false, message: '发布帖子失败' });
  }
}

async function getPosts(req, res) {
  try {
    const { page = 1, limit = 10, category } = req.query;
    const offset = (page - 1) * limit;

    const db = getDB();
    let query = `
      SELECT p.*, u.nickname, u.avatar
      FROM posts p
      JOIN users u ON p.user_id = u.id
    `;
    const params = [];

    if (category) {
      query += ' WHERE p.category = ?';
      params.push(category);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const posts = db.prepare(query).all(...params);

    const countQuery = category 
      ? 'SELECT COUNT(*) as total FROM posts WHERE category = ?'
      : 'SELECT COUNT(*) as total FROM posts';
    const { total } = db.prepare(countQuery).get(category || []);

    res.json({
      success: true,
      posts: posts.map(p => ({
        ...p,
        images: p.images ? JSON.parse(p.images) : []
      })),
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('获取帖子列表失败:', error);
    res.status(500).json({ success: false, message: '获取帖子列表失败' });
  }
}

async function getPostDetail(req, res) {
  try {
    const { id } = req.params;
    const db = getDB();

    db.prepare('UPDATE posts SET views_count = views_count + 1 WHERE id = ?').run(id);

    const post = db.prepare(`
      SELECT p.*, u.nickname, u.avatar
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(id);

    if (!post) {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }

    const comments = db.prepare(`
      SELECT c.*, u.nickname, u.avatar
      FROM post_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(id);

    const liked = db.prepare('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?').get(id, req.user?.id);

    res.json({
      success: true,
      post: {
        ...post,
        images: post.images ? JSON.parse(post.images) : []
      },
      comments,
      isLiked: !!liked
    });
  } catch (error) {
    console.error('获取帖子详情失败:', error);
    res.status(500).json({ success: false, message: '获取帖子详情失败' });
  }
}

async function toggleLike(req, res) {
  try {
    const { id } = req.params;
    const db = getDB();

    const existing = db.prepare('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?').get(id, req.user.id);

    if (existing) {
      db.prepare('DELETE FROM post_likes WHERE id = ?').run(existing.id);
      db.prepare('UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?').run(id);
      res.json({ success: true, message: '取消点赞成功', liked: false });
    } else {
      db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)').run(id, req.user.id);
      db.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?').run(id);
      res.json({ success: true, message: '点赞成功', liked: true });
    }
  } catch (error) {
    console.error('操作失败:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
}

async function addComment(req, res) {
  try {
    const { id } = req.params;
    const { content, parentId } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: '请输入评论内容' });
    }

    const db = getDB();
    const result = db.prepare(`
      INSERT INTO post_comments (post_id, user_id, content, parent_id)
      VALUES (?, ?, ?, ?)
    `).run(id, req.user.id, content, parentId || null);

    db.prepare('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?').run(id);

    const comment = db.prepare(`
      SELECT c.*, u.nickname, u.avatar
      FROM post_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.json({
      success: true,
      message: '评论成功',
      comment
    });
  } catch (error) {
    console.error('评论失败:', error);
    res.status(500).json({ success: false, message: '评论失败' });
  }
}

async function getMyPosts(req, res) {
  try {
    const db = getDB();
    const posts = db.prepare(`
      SELECT p.*, u.nickname, u.avatar
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `).all(req.user.id);

    res.json({
      success: true,
      posts: posts.map(p => ({
        ...p,
        images: p.images ? JSON.parse(p.images) : []
      }))
    });
  } catch (error) {
    console.error('获取我的帖子失败:', error);
    res.status(500).json({ success: false, message: '获取我的帖子失败' });
  }
}

module.exports = { createPost, getPosts, getPostDetail, toggleLike, addComment, getMyPosts };
