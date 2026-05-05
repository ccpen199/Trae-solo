const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../database');

router.get('/', (req, res) => {
  try {
    const { category, type, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }
    
    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }
    
    const totalResult = getQuery(`
      SELECT COUNT(*) as total FROM media ${whereClause}
    `, params);
    
    const media = allQuery(`
      SELECT * FROM media 
      ${whereClause}
      ORDER BY is_recommended DESC, rating DESC, created_at DESC 
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    res.json({
      success: true,
      data: {
        list: media,
        total: totalResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('媒体列表获取失败:', error);
    res.status(500).json({ success: false, message: '获取媒体列表失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const item = getQuery('SELECT * FROM media WHERE id = ?', [id]);
    
    if (!item) {
      return res.status(404).json({ success: false, message: '媒体不存在' });
    }
    
    runQuery('UPDATE media SET view_count = view_count + 1 WHERE id = ?', [id]);
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('媒体详情获取失败:', error);
    res.status(500).json({ success: false, message: '获取媒体详情失败' });
  }
});

module.exports = router;
