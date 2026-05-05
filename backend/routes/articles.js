const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../database');

router.get('/', (req, res) => {
  try {
    const { category_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE a.status = 1';
    const params = [];
    
    if (category_id) {
      whereClause += ' AND a.category_id = ?';
      params.push(parseInt(category_id));
    }
    
    const totalResult = getQuery(`
      SELECT COUNT(*) as total FROM articles a ${whereClause}
    `, params);
    
    const articles = allQuery(`
      SELECT a.*, c.name as category_name, c.slug as category_slug
      FROM articles a 
      LEFT JOIN categories c ON a.category_id = c.id 
      ${whereClause}
      ORDER BY a.published_at DESC 
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    res.json({
      success: true,
      data: {
        list: articles,
        total: totalResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('文章列表获取失败:', error);
    res.status(500).json({ success: false, message: '获取文章列表失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const article = getQuery(`
      SELECT a.*, c.name as category_name, c.slug as category_slug
      FROM articles a 
      LEFT JOIN categories c ON a.category_id = c.id 
      WHERE a.id = ? AND a.status = 1
    `, [id]);
    
    if (!article) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }
    
    runQuery('UPDATE articles SET view_count = view_count + 1 WHERE id = ?', [id]);
    
    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    console.error('文章详情获取失败:', error);
    res.status(500).json({ success: false, message: '获取文章详情失败' });
  }
});

module.exports = router;
