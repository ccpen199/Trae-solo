const db = require('../models/database');

const createPost = async (req, res) => {
  try {
    const { content, location, topics, visibility = 'public' } = req.body;
    const userId = req.user.id;

    const images = req.files?.images ? req.files.images.map(f => `/uploads/${f.filename}`).join(',') : null;
    const video = req.files?.video ? `/uploads/${req.files.video[0].filename}` : null;

    const result = db.prepare(`
      INSERT INTO posts (user_id, content, images, video, location, topics, visibility)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, content, images, video, location, topics?.join(','), visibility);

    res.json({
      success: true,
      message: '动态发布成功',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '发布动态失败'
    });
  }
};

const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, userId } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.*, u.nickname, u.avatar,
        COUNT(DISTINCT pl.id) as likes,
        COUNT(DISTINCT c.id) as comments
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN post_likes pl ON pl.post_id = p.id
      LEFT JOIN comments c ON c.post_id = p.id
      WHERE p.visibility = 'public'
    `;

    if (userId) {
      query += ` AND p.user_id = ${userId}`;
    }

    query += ` GROUP BY p.id ORDER BY p.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const posts = db.prepare(query).all();

    const formattedPosts = posts.map(post => ({
      id: post.id,
      userId: post.user_id,
      nickname: post.nickname,
      avatar: post.avatar,
      content: post.content,
      images: post.images ? post.images.split(',') : [],
      video: post.video,
      location: post.location,
      topics: post.topics ? post.topics.split(',') : [],
      visibility: post.visibility,
      createdAt: post.created_at,
      likes: post.likes,
      comments: post.comments
    }));

    res.json({
      success: true,
      data: formattedPosts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取动态失败'
    });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { keyword, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    if (!keyword) {
      return res.json({ success: true, data: [] });
    }

    const users = db.prepare(`
      SELECT id, nickname, avatar, gender, age, industry, profession, current_city as currentCity
      FROM users
      WHERE is_profile_complete = 1 AND (nickname LIKE ? OR phone LIKE ?)
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(`%${keyword}%`, `%${keyword}%`, limit, offset);

    res.json({
      success: true,
      data: users.map(u => ({
        ...u,
        avatar: u.avatar || 'https://via.placeholder.com/150'
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '搜索用户失败'
    });
  }
};

const getLatestUsers = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const users = db.prepare(`
      SELECT id, nickname, avatar, gender, age, industry, profession, current_city as currentCity, created_at
      FROM users
      WHERE is_profile_complete = 1
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit);

    res.json({
      success: true,
      data: users.map(u => ({
        ...u,
        avatar: u.avatar || 'https://via.placeholder.com/150'
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取最新用户失败'
    });
  }
};

module.exports = {
  createPost,
  getPosts,
  searchUsers,
  getLatestUsers
};
