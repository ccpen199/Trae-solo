const db = require('../config/database');
const { success, error } = require('../utils/response');

const getCircles = (req, res) => {
  try {
    const circles = db.prepare('SELECT c.*, u.nickname as owner_name, u.avatar as owner_avatar FROM circles c LEFT JOIN users u ON c.owner_id = u.id ORDER BY c.member_count DESC LIMIT 20').all();
    res.json(success(circles));
  } catch (err) {
    console.error('获取圈子列表失败:', err);
    res.status(500).json(error('获取圈子列表失败'));
  }
};

const getCircleDetail = (req, res) => {
  const circleId = req.params.id;

  try {
    const circle = db.prepare('SELECT c.*, u.nickname as owner_name FROM circles c LEFT JOIN users u ON c.owner_id = u.id WHERE c.id = ?').get(circleId);
    if (!circle) {
      return res.status(404).json(error('圈子不存在'));
    }
    res.json(success(circle));
  } catch (err) {
    console.error('获取圈子详情失败:', err);
    res.status(500).json(error('获取圈子详情失败'));
  }
};

const getCirclePosts = (req, res) => {
  const circleId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const offset = (page - 1) * pageSize;

  try {
    const posts = db.prepare('SELECT p.*, u.nickname, u.avatar FROM posts p LEFT JOIN users u ON p.user_id = u.id WHERE p.circle_id = ? ORDER BY p.created_at DESC LIMIT ? OFFSET ?').all(circleId, pageSize, offset);
    res.json(success(posts));
  } catch (err) {
    console.error('获取帖子列表失败:', err);
    res.status(500).json(error('获取帖子列表失败'));
  }
};

const createPost = (req, res) => {
  const userId = req.user.id;
  const { circle_id, content, images } = req.body;

  if (!content) {
    return res.status(400).json(error('内容不能为空'));
  }

  try {
    const result = db.prepare('INSERT INTO posts (user_id, circle_id, content, images) VALUES (?, ?, ?, ?)').run(userId, circle_id || null, content, images ? JSON.stringify(images) : null);
    res.json(success({ id: result.lastInsertRowid }, '发布成功'));
  } catch (err) {
    console.error('发布失败:', err);
    res.status(500).json(error('发布失败'));
  }
};

const getExplorePosts = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const offset = (page - 1) * pageSize;

  try {
    const posts = db.prepare('SELECT p.*, u.nickname, u.avatar, c.name as circle_name FROM posts p LEFT JOIN users u ON p.user_id = u.id LEFT JOIN circles c ON p.circle_id = c.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?').all(pageSize, offset);
    res.json(success(posts));
  } catch (err) {
    console.error('获取发现内容失败:', err);
    res.status(500).json(error('获取发现内容失败'));
  }
};

module.exports = { getCircles, getCircleDetail, getCirclePosts, createPost, getExplorePosts };