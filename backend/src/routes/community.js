const express = require('express');
const { db } = require('../models/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

const recyclingPoints = {
  'paper': 5,
  'plastic': 3,
  'glass': 4,
  'metal': 8,
  'electronics': 15,
  'clothes': 6,
  'battery': 10,
  'oil': 12
};

router.post('/stations/register', authenticateToken, (req, res) => {
  try {
    const { name, address, contact, id_card } = req.body;

    if (!name || !address || !contact) {
      return res.status(400).json({ error: '请填写完整的驿站信息' });
    }

    const existingStation = db.prepare('SELECT id FROM stations WHERE name = ? OR address = ?').get(name, address);
    if (existingStation) {
      return res.status(400).json({ error: '该驿站名称或地址已存在' });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run('station_master', req.user.id);

    const result = db.prepare(`
      INSERT INTO stations (name, address, manager_id, contact, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, address, req.user.id, contact, 'pending');

    const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(result.lastInsertRowid);
    const user = db.prepare('SELECT id, username, phone, role FROM users WHERE id = ?').get(req.user.id);

    res.status(201).json({
      success: true,
      message: '驿站入驻申请已提交，等待审核',
      data: {
        station,
        user
      }
    });
  } catch (err) {
    console.error('驿站注册错误:', err);
    res.status(500).json({ error: '驿站注册失败' });
  }
});

router.get('/stations', (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT s.*, u.username as manager_name, u.phone as manager_phone
      FROM stations s
      LEFT JOIN users u ON s.manager_id = u.id
    `;
    const params = [];

    if (status) {
      query += ' WHERE s.status = ?';
      params.push(status);
    } else {
      query += ' WHERE s.status = ?';
      params.push('active');
    }

    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const stations = db.prepare(query).all(...params);

    const countQuery = 'SELECT COUNT(*) as total FROM stations';
    const countParams = [];
    if (status) {
      countQuery += ' WHERE status = ?';
      countParams.push(status);
    }
    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({
      success: true,
      data: stations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('获取驿站列表错误:', err);
    res.status(500).json({ error: '获取驿站列表失败' });
  }
});

router.get('/posts', (req, res) => {
  try {
    const { type, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, u.username as author_name
      FROM community_posts p
      LEFT JOIN users u ON p.user_id = u.id
    `;
    const params = [];
    const conditions = [];

    if (type) {
      conditions.push('p.type = ?');
      params.push(type);
    }

    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const posts = db.prepare(query).all(...params);

    const countQuery = 'SELECT COUNT(*) as total FROM community_posts';
    const countParams = [];
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
      countParams.push(...params.slice(0, -2));
    }
    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('获取帖子列表错误:', err);
    res.status(500).json({ error: '获取帖子列表失败' });
  }
});

router.post('/posts', authenticateToken, (req, res) => {
  try {
    const { type, title, content, reward } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: '请填写帖子类型和标题' });
    }

    if (!['help_offer', 'help_request'].includes(type)) {
      return res.status(400).json({ error: '帖子类型无效' });
    }

    const result = db.prepare(`
      INSERT INTO community_posts (user_id, type, title, content, reward, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, type, title, content, reward ? parseFloat(reward) : 0, 'open');

    const post = db.prepare(`
      SELECT p.*, u.username as author_name
      FROM community_posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: '帖子发布成功',
      data: post
    });
  } catch (err) {
    console.error('发布帖子错误:', err);
    res.status(500).json({ error: '发布帖子失败' });
  }
});

router.post('/posts/:id/claim', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(id);
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    if (post.user_id === req.user.id) {
      return res.status(400).json({ error: '不能认领自己的帖子' });
    }

    if (post.status !== 'open') {
      return res.status(400).json({ error: '该帖子已被认领或已关闭' });
    }

    db.prepare('UPDATE community_posts SET status = ? WHERE id = ?').run('claimed', id);

    const updatedPost = db.prepare(`
      SELECT p.*, u.username as author_name
      FROM community_posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(id);

    res.json({
      success: true,
      message: '认领成功',
      data: updatedPost
    });
  } catch (err) {
    console.error('认领帖子错误:', err);
    res.status(500).json({ error: '认领失败' });
  }
});

router.post('/recycling', authenticateToken, (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: '请提交回收物品' });
    }

    let totalPoints = 0;
    const records = [];

    for (const item of items) {
      if (!item.item_type || !item.quantity) {
        continue;
      }

      const pointsPerItem = recyclingPoints[item.item_type] || 1;
      const points = pointsPerItem * parseInt(item.quantity);
      totalPoints += points;

      const result = db.prepare(`
        INSERT INTO recycling_records (user_id, item_type, quantity, points)
        VALUES (?, ?, ?, ?)
      `).run(req.user.id, item.item_type, parseInt(item.quantity), points);

      records.push({
        id: result.lastInsertRowid,
        item_type: item.item_type,
        quantity: item.quantity,
        points
      });
    }

    res.status(201).json({
      success: true,
      message: '回收提交成功',
      data: {
        records,
        total_points: totalPoints
      }
    });
  } catch (err) {
    console.error('回收提交错误:', err);
    res.status(500).json({ error: '回收提交失败' });
  }
});

router.get('/recycling/points', authenticateToken, (req, res) => {
  try {
    const records = db.prepare(`
      SELECT * FROM recycling_records 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(req.user.id);

    const totalPoints = records.reduce((sum, r) => sum + r.points, 0);

    const itemStats = db.prepare(`
      SELECT item_type, SUM(quantity) as total_quantity, SUM(points) as total_points
      FROM recycling_records
      WHERE user_id = ?
      GROUP BY item_type
    `).all(req.user.id);

    res.json({
      success: true,
      data: {
        total_points: totalPoints,
        records_count: records.length,
        item_stats: itemStats,
        recent_records: records.slice(0, 10)
      }
    });
  } catch (err) {
    console.error('查询积分错误:', err);
    res.status(500).json({ error: '查询积分失败' });
  }
});

module.exports = router;
