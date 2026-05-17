const db = require('../models/database');
const { validationResult } = require('express-validator');

const createTopic = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg
    });
  }

  const { planet_id, title, content, is_question = 0 } = req.body;
  const userId = req.user.id;

  try {
    const member = db.prepare('SELECT * FROM planet_members WHERE planet_id = ? AND user_id = ?').get(planet_id, userId);
    if (!member) {
      return res.status(403).json({
        success: false,
        message: '只有星球成员才能发布内容'
      });
    }

    const result = db.prepare(
      'INSERT INTO topics (planet_id, user_id, title, content, is_question) VALUES (?, ?, ?, ?, ?)'
    ).run(planet_id, userId, title, content, is_question ? 1 : 0);

    const topicId = result.lastInsertRowid;

    db.prepare('UPDATE planets SET topic_count = topic_count + 1 WHERE id = ?').run(planet_id);

    const topic = db.prepare(`
      SELECT t.*, u.nickname, u.avatar 
      FROM topics t 
      JOIN users u ON t.user_id = u.id 
      WHERE t.id = ?
    `).get(topicId);

    res.json({
      success: true,
      data: topic,
      message: is_question ? '提问成功' : '主题发布成功'
    });
  } catch (error) {
    console.error('创建主题错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const getTopics = (req, res) => {
  const { planet_id, page = 1, pageSize = 20, type = 'all' } = req.query;
  const offset = (page - 1) * pageSize;

  try {
    let queryParams = [parseInt(pageSize), offset];
    let whereConditions = [];

    if (planet_id) {
      whereConditions.push('t.planet_id = ?');
      queryParams.unshift(planet_id);
    }

    if (type === 'question') {
      whereConditions.push('t.is_question = 1');
    } else if (type === 'topic') {
      whereConditions.push('t.is_question = 0');
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const topics = db.prepare(`
      SELECT t.*, u.nickname, u.avatar, p.name as planet_name
      FROM topics t 
      JOIN users u ON t.user_id = u.id 
      JOIN planets p ON t.planet_id = p.id
      ${whereClause}
      ORDER BY t.created_at DESC 
      LIMIT ? OFFSET ?
    `).all(...queryParams);

    const countParams = queryParams.slice(0, -2);
    const total = db.prepare(`
      SELECT COUNT(*) as count 
      FROM topics t
      ${whereClause}
    `).get(...countParams).count;

    res.json({
      success: true,
      data: {
        list: topics,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取主题列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const getTopicById = (req, res) => {
  const { id } = req.params;

  try {
    db.prepare('UPDATE topics SET view_count = view_count + 1 WHERE id = ?').run(id);

    const topic = db.prepare(`
      SELECT t.*, u.nickname, u.avatar, p.name as planet_name
      FROM topics t 
      JOIN users u ON t.user_id = u.id 
      JOIN planets p ON t.planet_id = p.id
      WHERE t.id = ?
    `).get(id);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '主题不存在'
      });
    }

    res.json({
      success: true,
      data: topic
    });
  } catch (error) {
    console.error('获取主题详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const addComment = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg
    });
  }

  const { topic_id, content, parent_id, is_answer = 0 } = req.body;
  const userId = req.user.id;

  try {
    const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(topic_id);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '主题不存在'
      });
    }

    const result = db.prepare(
      'INSERT INTO comments (topic_id, user_id, content, parent_id, is_answer) VALUES (?, ?, ?, ?, ?)'
    ).run(topic_id, userId, content, parent_id || null, is_answer ? 1 : 0);

    db.prepare('UPDATE topics SET comment_count = comment_count + 1 WHERE id = ?').run(topic_id);

    const comment = db.prepare(`
      SELECT c.*, u.nickname, u.avatar 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.json({
      success: true,
      data: comment,
      message: '评论成功'
    });
  } catch (error) {
    console.error('添加评论错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const getComments = (req, res) => {
  const { topic_id, page = 1, pageSize = 50 } = req.query;
  const offset = (page - 1) * pageSize;

  try {
    const comments = db.prepare(`
      SELECT c.*, u.nickname, u.avatar 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.topic_id = ?
      ORDER BY c.created_at ASC 
      LIMIT ? OFFSET ?
    `).all(topic_id, parseInt(pageSize), offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM comments WHERE topic_id = ?').get(topic_id).count;

    res.json({
      success: true,
      data: {
        list: comments,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取评论列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

const searchTopics = (req, res) => {
  const { keyword, planet_id, page = 1, pageSize = 20 } = req.query;
  const userId = req.user?.id;
  const offset = (page - 1) * pageSize;

  if (!keyword) {
    return res.status(400).json({
      success: false,
      message: '搜索关键词不能为空'
    });
  }

  try {
    const searchKeyword = `%${keyword}%`;
    let queryParams = [searchKeyword, searchKeyword, parseInt(pageSize), offset];
    let whereConditions = ['(t.title LIKE ? OR t.content LIKE ?)'];

    if (planet_id) {
      whereConditions.push('t.planet_id = ?');
      queryParams.splice(2, 0, planet_id);
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    const topics = db.prepare(`
      SELECT t.*, u.nickname, u.avatar, p.name as planet_name
      FROM topics t 
      JOIN users u ON t.user_id = u.id 
      JOIN planets p ON t.planet_id = p.id
      ${whereClause}
      ORDER BY t.created_at DESC 
      LIMIT ? OFFSET ?
    `).all(...queryParams);

    const countParams = queryParams.slice(0, -2);
    const total = db.prepare(`
      SELECT COUNT(*) as count 
      FROM topics t
      ${whereClause}
    `).get(...countParams).count;

    res.json({
      success: true,
      data: {
        list: topics,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('搜索主题错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

module.exports = {
  createTopic,
  getTopics,
  getTopicById,
  addComment,
  getComments,
  searchTopics
};
