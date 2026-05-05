const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../database');

router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    
    const totalResult = getQuery('SELECT COUNT(*) as total FROM albums');
    
    const albums = allQuery(`
      SELECT a.*, 
             (SELECT COUNT(*) FROM photos WHERE album_id = a.id) as photo_count
      FROM albums a 
      ORDER BY a.sort_order, a.created_at DESC 
      LIMIT ? OFFSET ?
    `, [parseInt(limit), offset]);
    
    res.json({
      success: true,
      data: {
        list: albums,
        total: totalResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('相册列表获取失败:', error);
    res.status(500).json({ success: false, message: '获取相册列表失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const album = getQuery(`
      SELECT a.*, 
             (SELECT COUNT(*) FROM photos WHERE album_id = a.id) as photo_count
      FROM albums a 
      WHERE a.id = ?
    `, [id]);
    
    if (!album) {
      return res.status(404).json({ success: false, message: '相册不存在' });
    }
    
    const photos = allQuery(`
      SELECT id, title, description, url, view_count, created_at
      FROM photos 
      WHERE album_id = ? 
      ORDER BY sort_order, created_at DESC
    `, [id]);
    
    runQuery('UPDATE albums SET view_count = view_count + 1 WHERE id = ?', [id]);
    
    res.json({
      success: true,
      data: {
        album,
        photos
      }
    });
  } catch (error) {
    console.error('相册详情获取失败:', error);
    res.status(500).json({ success: false, message: '获取相册详情失败' });
  }
});

router.get('/photo/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const photo = getQuery(`
      SELECT p.*, a.name as album_name, a.id as album_id
      FROM photos p 
      LEFT JOIN albums a ON p.album_id = a.id 
      WHERE p.id = ?
    `, [id]);
    
    if (!photo) {
      return res.status(404).json({ success: false, message: '照片不存在' });
    }
    
    runQuery('UPDATE photos SET view_count = view_count + 1 WHERE id = ?', [id]);
    
    res.json({
      success: true,
      data: photo
    });
  } catch (error) {
    console.error('照片详情获取失败:', error);
    res.status(500).json({ success: false, message: '获取照片详情失败' });
  }
});

module.exports = router;
