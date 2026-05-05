const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');

router.get('/data', optionalAuth, (req, res) => {
  const db = req.db;

  const banners = db.prepare(`
    SELECT * FROM banners 
    WHERE status = 1 
    ORDER BY sort ASC
  `).all();

  const categories = db.prepare(`
    SELECT * FROM categories 
    WHERE status = 1 
    ORDER BY sort ASC
  `).all();

  const hotProducts = db.prepare(`
    SELECT id, name, price, original_price, sales, main_image, is_hot, is_new, is_recommend
    FROM products 
    WHERE status = 1 AND is_hot = 1 
    ORDER BY sales DESC 
    LIMIT 10
  `).all();

  const recommendProducts = db.prepare(`
    SELECT id, name, price, original_price, sales, main_image, is_hot, is_new, is_recommend
    FROM products 
    WHERE status = 1 AND is_recommend = 1 
    ORDER BY sales DESC 
    LIMIT 10
  `).all();

  const newProducts = db.prepare(`
    SELECT id, name, price, original_price, sales, main_image, is_hot, is_new, is_recommend
    FROM products 
    WHERE status = 1 AND is_new = 1 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all();

  const articles = db.prepare(`
    SELECT id, title, summary, cover_image, author, view_count, category, created_at
    FROM articles 
    WHERE status = 1 
    ORDER BY created_at DESC 
    LIMIT 5
  `).all();

  const stations = db.prepare(`
    SELECT * FROM gas_stations 
    WHERE status = 1 
    ORDER BY distance ASC 
    LIMIT 5
  `).all();

  let userInfo = null;
  if (req.user) {
    userInfo = db.prepare(`
      SELECT id, phone, nickname, avatar, balance, yijie_coins, points
      FROM users 
      WHERE id = ?
    `).get(req.user.userId);
    
    if (userInfo) {
      const couponCount = db.prepare(`
        SELECT COUNT(*) as count FROM user_coupons 
        WHERE user_id = ? AND status = 'unused'
      `).get(req.user.userId);
      userInfo.coupon_count = couponCount?.count || 0;
    }
  }

  res.json({
    code: 200,
    message: 'success',
    data: {
      banners,
      categories,
      hot_products: hotProducts,
      recommend_products: recommendProducts,
      new_products: newProducts,
      articles,
      stations,
      user_info: userInfo
    }
  });
});

router.get('/banners', (req, res) => {
  const db = req.db;
  const banners = db.prepare(`
    SELECT * FROM banners WHERE status = 1 ORDER BY sort ASC
  `).all();

  res.json({
    code: 200,
    message: 'success',
    data: banners
  });
});

router.get('/categories', (req, res) => {
  const db = req.db;
  const categories = db.prepare(`
    SELECT * FROM categories WHERE status = 1 ORDER BY sort ASC
  `).all();

  res.json({
    code: 200,
    message: 'success',
    data: categories
  });
});

router.get('/articles', (req, res) => {
  const db = req.db;
  const { category, page = 1, pageSize = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  let query = `SELECT * FROM articles WHERE status = 1`;
  let params = [];
  
  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(pageSize), offset);

  const articles = db.prepare(query).all(...params);

  res.json({
    code: 200,
    message: 'success',
    data: {
      list: articles,
      page: parseInt(page),
      page_size: parseInt(pageSize)
    }
  });
});

router.get('/article/:id', (req, res) => {
  const db = req.db;
  const { id } = req.params;

  const article = db.prepare(`
    SELECT * FROM articles WHERE id = ?
  `).get(id);

  if (!article) {
    return res.json({
      code: 404,
      message: '文章不存在'
    });
  }

  db.prepare(`UPDATE articles SET view_count = view_count + 1 WHERE id = ?`).run(id);
  article.view_count = (article.view_count || 0) + 1;

  res.json({
    code: 200,
    message: 'success',
    data: article
  });
});

router.get('/stations', (req, res) => {
  const db = req.db;
  const { longitude, latitude, keyword, page = 1, pageSize = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  let query = `SELECT * FROM gas_stations WHERE status = 1`;
  let params = [];
  
  if (keyword) {
    query += ` AND (name LIKE ? OR address LIKE ?)`;
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  
  query += ` ORDER BY distance ASC LIMIT ? OFFSET ?`;
  params.push(parseInt(pageSize), offset);

  const stations = db.prepare(query).all(...params);

  res.json({
    code: 200,
    message: 'success',
    data: {
      list: stations,
      page: parseInt(page),
      page_size: parseInt(pageSize)
    }
  });
});

router.get('/station/:id', (req, res) => {
  const db = req.db;
  const { id } = req.params;

  const station = db.prepare(`SELECT * FROM gas_stations WHERE id = ?`).get(id);

  if (!station) {
    return res.json({
      code: 404,
      message: '油站不存在'
    });
  }

  try {
    station.services = JSON.parse(station.services || '[]');
    station.images = JSON.parse(station.images || '[]');
  } catch (e) {}

  res.json({
    code: 200,
    message: 'success',
    data: station
  });
});

router.post('/navigate', (req, res) => {
  const { stationId, longitude, latitude, platform = 'gaode' } = req.body;
  const db = req.db;

  const station = db.prepare(`SELECT * FROM gas_stations WHERE id = ?`).get(stationId);

  if (!station) {
    return res.json({
      code: 404,
      message: '油站不存在'
    });
  }

  let navigateUrl = '';
  
  switch (platform) {
    case 'gaode':
      navigateUrl = `https://uri.amap.com/marker?position=${station.longitude},${station.latitude}&name=${encodeURIComponent(station.name)}&src=yijie`;
      break;
    case 'baidu':
      navigateUrl = `https://api.map.baidu.com/marker?location=${station.latitude},${station.longitude}&title=${encodeURIComponent(station.name)}&output=html`;
      break;
    case 'tencent':
      navigateUrl = `https://apis.map.qq.com/uri/v1/marker?marker=coord:${station.latitude},${station.longitude};title:${encodeURIComponent(station.name)}&referer=yijie`;
      break;
    default:
      navigateUrl = `https://uri.amap.com/marker?position=${station.longitude},${station.latitude}&name=${encodeURIComponent(station.name)}&src=yijie`;
  }

  res.json({
    code: 200,
    message: 'success',
    data: {
      navigate_url: navigateUrl,
      station: {
        name: station.name,
        address: station.address,
        longitude: station.longitude,
        latitude: station.latitude
      }
    }
  });
});

module.exports = router;
