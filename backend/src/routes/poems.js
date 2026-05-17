const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT DISTINCT category FROM poems ORDER BY category
    `).all();

    res.json({
      success: true,
      data: categories.map(c => c.category)
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: '获取分类失败' });
  }
});

router.get('/excerpts', (req, res) => {
  try {
    const { categories, limit = 10, offset = 0 } = req.query;
    let query = 'SELECT * FROM poems';
    let params = [];

    if (categories && categories.length > 0) {
      const catArray = categories.split(',');
      const placeholders = catArray.map(() => '?').join(',');
      query += ` WHERE category IN (${placeholders})`;
      params = catArray;
    }

    query += ' ORDER BY RANDOM() LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const poems = db.prepare(query).all(...params);

    const formattedPoems = poems.map(poem => ({
      ...poem,
      tags: poem.tags ? poem.tags.split(',') : []
    }));

    res.json({
      success: true,
      data: formattedPoems
    });
  } catch (error) {
    console.error('Get excerpts error:', error);
    res.status(500).json({ success: false, message: '获取诗词失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const poem = db.prepare('SELECT * FROM poems WHERE id = ?').get(id);

    if (!poem) {
      return res.status(404).json({ success: false, message: '诗词不存在' });
    }

    poem.tags = poem.tags ? poem.tags.split(',') : [];

    res.json({ success: true, data: poem });
  } catch (error) {
    console.error('Get poem error:', error);
    res.status(500).json({ success: false, message: '获取诗词详情失败' });
  }
});

router.get('/settings/excerpt', authenticateToken, (req, res) => {
  try {
    const settings = db.prepare(`
      SELECT categories FROM user_excerpt_settings WHERE user_id = ?
    `).get(req.user.userId);

    const defaultCategories = ['唐诗', '宋词', '元曲', '现代诗'];

    res.json({
      success: true,
      data: {
        categories: settings ? settings.categories.split(',') : defaultCategories
      }
    });
  } catch (error) {
    console.error('Get excerpt settings error:', error);
    res.status(500).json({ success: false, message: '获取设置失败' });
  }
});

router.post('/settings/excerpt', authenticateToken, (req, res) => {
  try {
    const { categories } = req.body;
    const categoriesStr = categories.join(',');

    const existing = db.prepare(`
      SELECT id FROM user_excerpt_settings WHERE user_id = ?
    `).get(req.user.userId);

    if (existing) {
      db.prepare(`
        UPDATE user_excerpt_settings SET categories = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?
      `).run(categoriesStr, req.user.userId);
    } else {
      db.prepare(`
        INSERT INTO user_excerpt_settings (user_id, categories) VALUES (?, ?)
      `).run(req.user.userId, categoriesStr);
    }

    res.json({ success: true, message: '设置保存成功' });
  } catch (error) {
    console.error('Save excerpt settings error:', error);
    res.status(500).json({ success: false, message: '保存设置失败' });
  }
});

router.post('/:id/favorite', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const poem = db.prepare('SELECT id FROM poems WHERE id = ?').get(id);
    if (!poem) {
      return res.status(404).json({ success: false, message: '诗词不存在' });
    }

    try {
      db.prepare(`
        INSERT INTO favorites (user_id, poem_id) VALUES (?, ?)
      `).run(req.user.userId, id);

      res.json({ success: true, message: '收藏成功' });
    } catch (e) {
      db.prepare(`
        DELETE FROM favorites WHERE user_id = ? AND poem_id = ?
      `).run(req.user.userId, id);

      res.json({ success: true, message: '取消收藏成功' });
    }
  } catch (error) {
    console.error('Favorite error:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

router.get('/favorites/list', authenticateToken, (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const favorites = db.prepare(`
      SELECT p.* FROM poems p
      INNER JOIN favorites f ON p.id = f.poem_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.userId, parseInt(limit), parseInt(offset));

    favorites.forEach(p => {
      p.tags = p.tags ? p.tags.split(',') : [];
    });

    res.json({ success: true, data: favorites });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ success: false, message: '获取收藏失败' });
  }
});

module.exports = router;
