const db = require('../database');

const getGuides = (req, res) => {
  try {
    const { page = 1, limit = 10, destination_id, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT g.*, d.name as destination_name, u.username as author_name, u.avatar as author_avatar
      FROM guides g
      JOIN destinations d ON g.destination_id = d.id
      JOIN users u ON g.user_id = u.id
      WHERE g.status = 'published'
    `;
    let countQuery = "SELECT COUNT(*) as total FROM guides WHERE status = 'published'";
    let params = [];
    let countParams = [];

    if (destination_id) {
      query += ' AND g.destination_id = ?';
      countQuery += ' AND destination_id = ?';
      params.push(destination_id);
      countParams.push(destination_id);
    }

    if (search) {
      query += ' AND (g.title LIKE ? OR g.content LIKE ? OR d.name LIKE ?)';
      countQuery += ' AND (title LIKE ? OR content LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY g.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const guides = db.prepare(query).all(...params);
    const { total } = db.prepare(countQuery).get(...countParams);

    guides.forEach(guide => {
      guide.tags = guide.tags ? JSON.parse(guide.tags) : [];
    });

    res.json({
      guides,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    console.error('获取攻略列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

const getGuideById = (req, res) => {
  try {
    const { id } = req.params;

    db.prepare('UPDATE guides SET views = views + 1 WHERE id = ?').run(id);

    const guide = db.prepare(`
      SELECT g.*, d.name as destination_name, u.username as author_name, u.avatar as author_avatar, u.id as author_id
      FROM guides g
      JOIN destinations d ON g.destination_id = d.id
      JOIN users u ON g.user_id = u.id
      WHERE g.id = ?
    `).get(id);

    if (!guide) {
      return res.status(404).json({ error: '攻略不存在' });
    }

    guide.tags = guide.tags ? JSON.parse(guide.tags) : [];

    if (req.user) {
      const isFavorite = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND guide_id = ?').get(req.user.userId, id);
      const isLiked = db.prepare('SELECT id FROM guide_likes WHERE user_id = ? AND guide_id = ?').get(req.user.userId, id);
      guide.is_favorited = !!isFavorite;
      guide.is_liked = !!isLiked;
    }

    res.json(guide);
  } catch (error) {
    console.error('获取攻略详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

const createGuide = (req, res) => {
  try {
    const { destination_id, title, content, itinerary, budget, preparation, tags } = req.body;

    if (!destination_id || !title || !content) {
      return res.status(400).json({ error: '请填写所有必填项' });
    }

    const result = db.prepare(`
      INSERT INTO guides (user_id, destination_id, title, content, itinerary, budget, preparation, tags, cover_image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.userId,
      destination_id,
      title,
      content,
      itinerary || '',
      budget || '',
      preparation || '',
      JSON.stringify(tags || []),
      `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=travel%20guide%20beautiful%20scenery&image_size=landscape_16_9`
    );

    res.status(201).json({ id: result.lastInsertRowid, message: '攻略发布成功' });
  } catch (error) {
    console.error('创建攻略错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

const toggleFavorite = (req, res) => {
  try {
    const { guide_id } = req.body;
    const user_id = req.user.userId;

    const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND guide_id = ?').get(user_id, guide_id);

    if (existing) {
      db.prepare('DELETE FROM favorites WHERE user_id = ? AND guide_id = ?').run(user_id, guide_id);
      res.json({ favorited: false, message: '已取消收藏' });
    } else {
      db.prepare('INSERT INTO favorites (user_id, guide_id) VALUES (?, ?)').run(user_id, guide_id);
      res.json({ favorited: true, message: '收藏成功' });
    }
  } catch (error) {
    console.error('收藏操作错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

const toggleLike = (req, res) => {
  try {
    const { guide_id } = req.body;
    const user_id = req.user.userId;

    const existing = db.prepare('SELECT id FROM guide_likes WHERE user_id = ? AND guide_id = ?').get(user_id, guide_id);

    if (existing) {
      db.prepare('DELETE FROM guide_likes WHERE user_id = ? AND guide_id = ?').run(user_id, guide_id);
      db.prepare('UPDATE guides SET likes = likes - 1 WHERE id = ?').run(guide_id);
      res.json({ liked: false, message: '已取消点赞' });
    } else {
      db.prepare('INSERT INTO guide_likes (user_id, guide_id) VALUES (?, ?)').run(user_id, guide_id);
      db.prepare('UPDATE guides SET likes = likes + 1 WHERE id = ?').run(guide_id);
      res.json({ liked: true, message: '点赞成功' });
    }
  } catch (error) {
    console.error('点赞操作错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

module.exports = { getGuides, getGuideById, createGuide, toggleFavorite, toggleLike };
