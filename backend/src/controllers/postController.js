const db = require('../models/db');

const createPost = (req, res) => {
  const userId = req.user.userId;
  const { content, images, location } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: '请输入内容'
    });
  }

  const insertPost = db.prepare('INSERT INTO posts (user_id, content, images, location) VALUES (?, ?, ?, ?)');
  const result = insertPost.run(userId, content.trim(), images ? JSON.stringify(images) : null, location);

  res.json({
    success: true,
    message: '发布成功',
    data: { postId: result.lastInsertRowid }
  });
};

const getPosts = (req, res) => {
  const userId = req.user?.userId || 0;
  const { type = 'recommend', page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      p.id, p.content, p.images, p.location, p.created_at,
      u.id as user_id, u.nickname, u.avatar,
      COUNT(DISTINCT l.id) as like_count,
      CASE WHEN EXISTS (SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.id) THEN 1 ELSE 0 END as is_liked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN likes l ON p.id = l.post_id
  `;

  const params = [userId];

  if (type === 'following' && userId) {
    query += ` WHERE p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)`;
    params.push(userId);
  }

  query += ` GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const stmt = db.prepare(query);
  const posts = stmt.all(...params);

  const formattedPosts = posts.map(post => ({
    ...post,
    images: post.images ? JSON.parse(post.images) : []
  }));

  res.json({
    success: true,
    data: { posts: formattedPosts, hasMore: posts.length === limit }
  });
};

const toggleLike = (req, res) => {
  const userId = req.user.userId;
  const { postId } = req.body;

  const checkLike = db.prepare('SELECT id FROM likes WHERE user_id = ? AND post_id = ?');
  const like = checkLike.get(userId, postId);

  if (like) {
    const deleteLike = db.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?');
    deleteLike.run(userId, postId);
    res.json({ success: true, data: { liked: false } });
  } else {
    const insertLike = db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)');
    insertLike.run(userId, postId);
    res.json({ success: true, data: { liked: true } });
  }
};

const getUserProfile = (req, res) => {
  const { userId } = req.params;

  const getUser = db.prepare('SELECT id, nickname, avatar, gender, bio, birthday, location, created_at FROM users WHERE id = ?');
  const user = getUser.get(userId);

  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  const getSoulTest = db.prepare('SELECT personality_type FROM soul_test WHERE user_id = ?');
  const soulTest = getSoulTest.get(userId);

  const getInterests = db.prepare(`
    SELECT i.name, i.category FROM user_interests ui
    JOIN interests i ON ui.interest_id = i.id
    WHERE ui.user_id = ?
  `);
  const interests = getInterests.all(userId);

  const getPraises = db.prepare(`
    SELECT p.content, p.created_at, u.nickname, u.avatar FROM praises p
    JOIN users u ON p.from_user_id = u.id
    WHERE p.to_user_id = ? ORDER BY p.created_at DESC LIMIT 10
  `);
  const praises = getPraises.all(userId);

  const getPostCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE user_id = ?');
  const postCount = getPostCount.get(userId);

  const getFollowerCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?');
  const followerCount = getFollowerCount.get(userId);

  const getFollowingCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?');
  const followingCount = getFollowingCount.get(userId);

  res.json({
    success: true,
    data: {
      user: {
        ...user,
        personality_type: soulTest?.personality_type,
        interests,
        praises,
        post_count: postCount?.count || 0,
        follower_count: followerCount?.count || 0,
        following_count: followingCount?.count || 0
      }
    }
  });
};

module.exports = { createPost, getPosts, toggleLike, getUserProfile };
