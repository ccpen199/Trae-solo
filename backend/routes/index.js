const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../database');

router.get('/home', (req, res) => {
  try {
    const profile = getQuery('SELECT id, name, title, avatar, bio, email, location FROM profile LIMIT 1');
    
    const latestArticles = allQuery(`
      SELECT a.id, a.title, a.slug, a.summary, a.published_at, a.view_count, c.name as category_name
      FROM articles a 
      LEFT JOIN categories c ON a.category_id = c.id 
      WHERE a.status = 1 
      ORDER BY a.published_at DESC 
      LIMIT 5
    `);
    
    const recommendedArticles = allQuery(`
      SELECT a.id, a.title, a.slug, a.summary, a.cover_image, a.published_at, c.name as category_name
      FROM articles a 
      LEFT JOIN categories c ON a.category_id = c.id 
      WHERE a.status = 1 AND a.is_recommended = 1 
      ORDER BY a.published_at DESC 
      LIMIT 3
    `);
    
    const recommendedAlbums = allQuery(`
      SELECT id, name, description, cover_image, view_count 
      FROM albums 
      WHERE is_recommended = 1 
      ORDER BY sort_order 
      LIMIT 3
    `);
    
    const recommendedMedia = allQuery(`
      SELECT id, category, title, artist, year, rating, cover_image 
      FROM media 
      WHERE is_recommended = 1 
      ORDER BY rating DESC 
      LIMIT 4
    `);
    
    const categories = allQuery(`
      SELECT id, name, slug, description, icon 
      FROM categories 
      WHERE is_active = 1 
      ORDER BY sort_order
    `);
    
    res.json({
      success: true,
      data: {
        profile,
        latestArticles,
        recommendedArticles,
        recommendedAlbums,
        recommendedMedia,
        categories
      }
    });
  } catch (error) {
    console.error('首页数据获取失败:', error);
    res.status(500).json({ success: false, message: '获取首页数据失败' });
  }
});

router.get('/profile', (req, res) => {
  try {
    const profile = getQuery('SELECT * FROM profile LIMIT 1');
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('个人信息获取失败:', error);
    res.status(500).json({ success: false, message: '获取个人信息失败' });
  }
});

module.exports = router;
