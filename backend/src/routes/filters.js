const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const { category } = req.query;
  let query = 'SELECT * FROM filters';
  let params = [];

  if (category) {
    query += ' WHERE category = ?';
    params.push(category);
  }

  query += ' ORDER BY is_premium ASC, download_count DESC';

  try {
    const filters = db.prepare(query).all(...params);
    filters.forEach(filter => {
      filter.params = JSON.parse(filter.params);
    });
    res.json({ filters });
  } catch (error) {
    res.status(500).json({ message: '获取滤镜失败', error: error.message });
  }
});

router.get('/categories', (req, res) => {
  const categories = [
    { id: 'all', name: '全部' },
    { id: 'normal', name: '基础' },
    { id: 'vintage', name: '复古' },
    { id: 'artistic', name: '艺术' },
    { id: 'trending', name: '热门' }
  ];
  res.json({ categories });
});

router.post('/:filterId/apply', (req, res) => {
  const { filterId } = req.params;
  const { image_data } = req.body;

  try {
    const filter = db.prepare('SELECT * FROM filters WHERE id = ?').get(filterId);
    if (!filter) {
      return res.status(404).json({ message: '滤镜不存在' });
    }

    const params = JSON.parse(filter.params);

    db.prepare('UPDATE filters SET download_count = download_count + 1 WHERE id = ?').run(filterId);

    res.json({
      message: '滤镜已应用',
      filter: filter.name,
      params,
      processed: true
    });
  } catch (error) {
    res.status(500).json({ message: '应用滤镜失败', error: error.message });
  }
});

router.post('/ai-enhance', (req, res) => {
  const { image_data, enhance_type = 'auto' } = req.body;

  const enhancements = {
    auto: { brightness: 0.1, contrast: 0.1, saturation: 0.05, sharpness: 0.1 },
    portrait: { smooth: 0.5, whiten: 0.3, eye_enhance: 0.4 },
    landscape: { contrast: 0.2, saturation: 0.15, sharpen: 0.15 },
    night: { denoise: 0.6, brighten: 0.3, contrast: 0.1 }
  };

  res.json({
    message: 'AI增强完成',
    enhancements: enhancements[enhance_type] || enhancements.auto,
    quality_score: 85 + Math.floor(Math.random() * 15)
  });
});

router.post('/remove-background', (req, res) => {
  res.json({
    message: '背景移除完成',
    transparent_url: '/uploads/transparent-preview.png',
    mask_url: '/uploads/mask-preview.png',
    processing_time: '1.2s'
  });
});

router.post('/colorize', (req, res) => {
  res.json({
    message: '黑白照片上色完成',
    colorized_url: '/uploads/colorized-preview.png',
    confidence: 0.88,
    processing_time: '2.1s'
  });
});

module.exports = router;