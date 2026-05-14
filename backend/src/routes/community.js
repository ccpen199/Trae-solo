const express = require('express');
const db = require('../database');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/posts', optionalAuth, (req, res) => {
  const { type = 'discover', page = 1, page_size = 20 } = req.query;
  const offset = (page - 1) * page_size;
  
  let whereClause = 'WHERE p.status = 1';
  const params = [];
  
  if (type === 'following' && req.user) {
    whereClause += ' AND p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)';
    params.push(req.user.id);
  } else if (type === 'my' && req.user) {
    whereClause += ' AND p.user_id = ?';
    params.push(req.user.id);
  }
  
  const countResult = db.prepare(`
    SELECT COUNT(*) as total FROM posts p ${whereClause}
  `).get(...params);
  
  const posts = db.prepare(`
    SELECT p.*, u.nickname, u.avatar, u.is_shop_owner,
      (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) as is_liked
    FROM posts p
    LEFT JOIN users u ON p.user_id = u.id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.user?.id || 0, ...params, parseInt(page_size), offset);
  
  const formattedPosts = posts.map(post => {
    let images = [];
    try {
      images = JSON.parse(post.images);
    } catch (e) {
      images = [];
    }
    
    return {
      ...post,
      images,
      is_liked: post.is_liked > 0
    };
  });
  
  res.json({
    posts: formattedPosts,
    pagination: {
      page: parseInt(page),
      page_size: parseInt(page_size),
      total: countResult.total,
      total_pages: Math.ceil(countResult.total / page_size)
    }
  });
});

router.post('/posts', authenticate, (req, res) => {
  const { title, content, images, product_id } = req.body;
  
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Content is required' });
  }
  
  const imagesJson = images ? JSON.stringify(images) : null;
  
  const result = db.prepare(`
    INSERT INTO posts (user_id, title, content, images, product_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, title, content, imagesJson, product_id);
  
  res.json({
    success: true,
    post_id: result.lastInsertRowid
  });
});

router.get('/posts/:id', optionalAuth, (req, res) => {
  const post = db.prepare(`
    SELECT p.*, u.nickname, u.avatar, u.is_shop_owner,
      (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) as is_liked,
      (SELECT COUNT(*) FROM follows f WHERE f.follower_id = ? AND f.following_id = p.user_id) as is_following
    FROM posts p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ? AND p.status = 1
  `).get(req.user?.id || 0, req.user?.id || 0, req.params.id);
  
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  let images = [];
  try {
    images = JSON.parse(post.images);
  } catch (e) {
    images = [];
  }
  
  let product = null;
  if (post.product_id) {
    product = db.prepare('SELECT id, name, price, images FROM products WHERE id = ?').get(post.product_id);
    if (product) {
      let pImages = [];
      try {
        pImages = JSON.parse(product.images);
      } catch (e) {
        pImages = [];
      }
      product.images = pImages;
    }
  }
  
  const comments = db.prepare(`
    SELECT c.*, u.nickname, u.avatar
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at DESC
    LIMIT 20
  `).all(post.id);
  
  res.json({
    post: {
      ...post,
      images,
      is_liked: post.is_liked > 0,
      is_following: post.is_following > 0
    },
    product,
    comments
  });
});

router.post('/posts/:id/like', authenticate, (req, res) => {
  const postId = req.params.id;
  
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  const existingLike = db.prepare('SELECT * FROM likes WHERE post_id = ? AND user_id = ?')
    .get(postId, req.user.id);
  
  if (existingLike) {
    db.prepare('DELETE FROM likes WHERE post_id = ? AND user_id = ?').run(postId, req.user.id);
    db.prepare('UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?').run(postId);
    res.json({ success: true, liked: false });
  } else {
    db.prepare('INSERT INTO likes (post_id, user_id) VALUES (?, ?)').run(postId, req.user.id);
    db.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?').run(postId);
    res.json({ success: true, liked: true });
  }
});

router.post('/posts/:id/comment', authenticate, (req, res) => {
  const { content, parent_id } = req.body;
  const postId = req.params.id;
  
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Content is required' });
  }
  
  const result = db.prepare(`
    INSERT INTO comments (post_id, user_id, content, parent_id)
    VALUES (?, ?, ?, ?)
  `).run(postId, req.user.id, content, parent_id || 0);
  
  db.prepare('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?').run(postId);
  
  const comment = db.prepare(`
    SELECT c.*, u.nickname, u.avatar
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(result.lastInsertRowid);
  
  res.json({ success: true, comment });
});

router.post('/follow/:userId', authenticate, (req, res) => {
  const userIdToFollow = parseInt(req.params.userId);
  
  if (userIdToFollow === req.user.id) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userIdToFollow);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const existingFollow = db.prepare(`
    SELECT * FROM follows WHERE follower_id = ? AND following_id = ?
  `).get(req.user.id, userIdToFollow);
  
  if (existingFollow) {
    db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?')
      .run(req.user.id, userIdToFollow);
    res.json({ success: true, following: false });
  } else {
    db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)')
      .run(req.user.id, userIdToFollow);
    res.json({ success: true, following: true });
  }
});

router.get('/follows', authenticate, (req, res) => {
  const { type = 'following' } = req.query;
  
  let users;
  
  if (type === 'followers') {
    users = db.prepare(`
      SELECT u.*, 1 as is_following
      FROM follows f
      LEFT JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
    `).all(req.user.id);
  } else {
    users = db.prepare(`
      SELECT u.*, 1 as is_following
      FROM follows f
      LEFT JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
    `).all(req.user.id);
  }
  
  res.json({ users });
});

module.exports = router;
