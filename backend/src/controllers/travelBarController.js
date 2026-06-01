const db = require('../database');

const getTravelBars = (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT tb.*, u.username as author_name, u.avatar as author_avatar
      FROM travel_bars tb
      JOIN users u ON tb.user_id = u.id
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM travel_bars';
    let params = [];
    let countParams = [];

    if (search) {
      query += ' WHERE tb.title LIKE ? OR tb.content LIKE ?';
      countQuery += ' WHERE title LIKE ? OR content LIKE ?';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY tb.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const travelBars = db.prepare(query).all(...params);
    const { total } = db.prepare(countQuery).get(...countParams);

    travelBars.forEach(bar => {
      bar.tags = bar.tags ? JSON.parse(bar.tags) : [];
    });

    res.json({
      travelBars,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    console.error('获取旅吧列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

const getTravelBarById = (req, res) => {
  try {
    const { id } = req.params;

    const travelBar = db.prepare(`
      SELECT tb.*, u.username as author_name, u.avatar as author_avatar, u.id as author_id
      FROM travel_bars tb
      JOIN users u ON tb.user_id = u.id
      WHERE tb.id = ?
    `).get(id);

    if (!travelBar) {
      return res.status(404).json({ error: '话题不存在' });
    }

    travelBar.tags = travelBar.tags ? JSON.parse(travelBar.tags) : [];

    if (req.user) {
      const isLiked = db.prepare('SELECT id FROM travel_bar_likes WHERE user_id = ? AND travel_bar_id = ?').get(req.user.userId, id);
      travelBar.is_liked = !!isLiked;
    }

    res.json(travelBar);
  } catch (error) {
    console.error('获取旅吧详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

const createTravelBar = (req, res) => {
  try {
    const { title, content, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: '请填写所有必填项' });
    }

    const result = db.prepare(`
      INSERT INTO travel_bars (user_id, title, content, tags)
      VALUES (?, ?, ?, ?)
    `).run(req.user.userId, title, content, JSON.stringify(tags || []));

    res.status(201).json({ id: result.lastInsertRowid, message: '话题发布成功' });
  } catch (error) {
    console.error('创建话题错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

const toggleLike = (req, res) => {
  try {
    const { travel_bar_id } = req.body;
    const user_id = req.user.userId;

    const existing = db.prepare('SELECT id FROM travel_bar_likes WHERE user_id = ? AND travel_bar_id = ?').get(user_id, travel_bar_id);

    if (existing) {
      db.prepare('DELETE FROM travel_bar_likes WHERE user_id = ? AND travel_bar_id = ?').run(user_id, travel_bar_id);
      db.prepare('UPDATE travel_bars SET likes = likes - 1 WHERE id = ?').run(travel_bar_id);
      res.json({ liked: false, message: '已取消点赞' });
    } else {
      db.prepare('INSERT INTO travel_bar_likes (user_id, travel_bar_id) VALUES (?, ?)').run(user_id, travel_bar_id);
      db.prepare('UPDATE travel_bars SET likes = likes + 1 WHERE id = ?').run(travel_bar_id);
      res.json({ liked: true, message: '点赞成功' });
    }
  } catch (error) {
    console.error('点赞操作错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

module.exports = { getTravelBars, getTravelBarById, createTravelBar, toggleLike };
