const express = require('express');
const router = express.Router();
const { success, error, query, queryOne } = require('../utils');

router.get('/', async (req, res) => {
  try {
    const banners = await query('SELECT * FROM banners WHERE status = 1 ORDER BY sort_order ASC');
    const posts = await query('SELECT p.*, u.nickname, u.avatar FROM posts p LEFT JOIN users u ON p.user_id = u.id WHERE p.status = 1 ORDER BY p.created_at DESC LIMIT 6');
    const products = await query('SELECT * FROM products WHERE status = 1 ORDER BY sales DESC LIMIT 8');
    const activities = await query('SELECT * FROM activities WHERE status = 1 ORDER BY start_time DESC LIMIT 4');
    const designers = await query('SELECT * FROM designers WHERE status = 1 ORDER BY followers DESC LIMIT 6');
    const coupons = await query('SELECT * FROM coupons WHERE status = 1 ORDER BY created_at DESC LIMIT 3');
    const cases = await query('SELECT cc.*, d.real_name FROM custom_cases cc LEFT JOIN designers d ON cc.designer_id = d.id WHERE cc.status = 1 ORDER BY cc.created_at DESC LIMIT 6');
    
    res.json(success({
      banners,
      posts,
      products,
      activities,
      designers,
      coupons,
      cases
    }));
  } catch (e) {
    res.json(error('获取失败'));
  }
});

router.get('/banners', async (req, res) => {
  try {
    const banners = await query('SELECT * FROM banners WHERE status = 1 ORDER BY sort_order ASC');
    res.json(success(banners));
  } catch (e) {
    res.json(error('获取失败'));
  }
});

router.get('/activities', async (req, res) => {
  try {
    const activities = await query('SELECT * FROM activities WHERE status = 1 ORDER BY start_time DESC');
    res.json(success(activities));
  } catch (e) {
    res.json(error('获取失败'));
  }
});

module.exports = router;