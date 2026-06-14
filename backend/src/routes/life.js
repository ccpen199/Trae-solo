const express = require('express');
const db = require('../db');
const { authenticateToken, optionalAuthenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/weather', (req, res) => {
  const { region } = req.query;
  
  const sql = region 
    ? 'SELECT * FROM weather_data WHERE region = ? ORDER BY date DESC LIMIT 7'
    : 'SELECT * FROM weather_data ORDER BY date DESC, region LIMIT 20';
  
  const weather = db.prepare(sql).all(...(region ? [region] : []));
  
  res.success(weather, '获取成功');
});

router.get('/pois', (req, res) => {
  const { category, keyword, metro_line, metro_station, lat, lng, radius = 3000 } = req.query;
  
  let sql = 'SELECT * FROM pois WHERE status = 1';
  const params = [];
  
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  
  if (keyword) {
    sql += ' AND (name LIKE ? OR address LIKE ? OR tags LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }
  
  if (metro_line) {
    sql += ' AND metro_line = ?';
    params.push(metro_line);
  }
  
  if (metro_station) {
    sql += ' AND metro_station = ?';
    params.push(metro_station);
  }
  
  sql += ' ORDER BY rating DESC, discount_info DESC LIMIT 50';
  
  const pois = db.prepare(sql).all(...params);
  
  if (lat && lng) {
    pois.forEach(p => {
      const R = 6371;
      const dLat = (parseFloat(lat) - p.latitude) * Math.PI / 180;
      const dLng = (parseFloat(lng) - p.longitude) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(p.latitude * Math.PI / 180) * Math.cos(parseFloat(lat) * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      p.distance = Math.round(R * c * 1000);
    });
    
    pois.sort((a, b) => a.distance - b.distance);
  }
  
  res.success(pois, '获取成功');
});

router.get('/pois/:id', (req, res) => {
  const poi = db.prepare('SELECT * FROM pois WHERE id = ?').get(req.params.id);
  
  if (!poi) {
    return res.error('POI不存在', 404);
  }
  
  const related = db.prepare(`
    SELECT * FROM pois 
    WHERE (metro_line = ? OR category = ?) AND id != ?
    ORDER BY rating DESC LIMIT 5
  `).all(poi.metro_line, poi.category, poi.id);
  
  res.success({ ...poi, related }, '获取成功');
});

router.get('/discounts-nearby', optionalAuthenticate, (req, res) => {
  const { lat, lng, metro_station, category } = req.query;
  
  let sql = `
    SELECT p.*
    FROM pois p
    WHERE p.status = 1 AND p.discount_info IS NOT NULL AND p.discount_info != '' AND p.discount_info != '无'
  `;
  const params = [];
  
  if (metro_station) {
    sql += ' AND p.metro_station = ?';
    params.push(metro_station);
  }
  
  if (category) {
    sql += ' AND p.category = ?';
    params.push(category);
  }
  
  sql += ' ORDER BY p.rating DESC LIMIT 20';
  
  let discounts = db.prepare(sql).all(...params);
  
  discounts = discounts.map(p => {
    let distance = null;
    if (lat && lng) {
      const R = 6371;
      const dLat = (parseFloat(lat) - p.latitude) * Math.PI / 180;
      const dLng = (parseFloat(lng) - p.longitude) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(p.latitude * Math.PI / 180) * Math.cos(parseFloat(lat) * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      distance = Math.round(R * c * 1000);
    }
    
    const discountMatch = p.discount_info.match(/(\d+\.?\d*)折/);
    const discount = discountMatch ? parseFloat(discountMatch[1]) : null;
    
    return {
      id: p.id,
      poi_id: p.poi_id,
      merchant_name: p.name,
      description: p.discount_info,
      discount: discount,
      line_name: p.metro_line,
      station_name: p.metro_station,
      address: p.address,
      rating: p.rating,
      distance: distance,
      category: p.category,
      image_url: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(p.name)}&image_size=square`,
    };
  });
  
  if (lat && lng) {
    discounts.sort((a, b) => (a.distance || 99999) - (b.distance || 99999));
  }
  
  if (req.user) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (user && user.user_type === 'student') {
      discounts = discounts.map(d => ({
        ...d,
        extra_discount: '学生额外95折'
      }));
    }
  }
  
  res.success({ list: discounts, total: discounts.length, user_id: req.user?.id || null }, '获取成功');
});

router.get('/recommendations', optionalAuthenticate, (req, res) => {
  let userLevel = 1;
  let preferredLines = [];
  let preferredTypes = [];
  
  if (req.user) {
    const userPoints = db.prepare('SELECT * FROM user_points WHERE user_id = ?').get(req.user.id);
    const transactions = db.prepare('SELECT DISTINCT transport_type, route_name FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(req.user.id);
    
    preferredLines = [...new Set(transactions.map(t => t.route_name))].filter(Boolean);
    preferredTypes = [...new Set(transactions.map(t => t.transport_type))].filter(Boolean);
    userLevel = userPoints ? userPoints.level : 1;
  }
  
  let sql = 'SELECT * FROM pois WHERE status = 1';
  const params = [];
  
  if (preferredLines.length > 0) {
    const placeholders = preferredLines.map(() => '?').join(',');
    sql += ` AND metro_line IN (${placeholders})`;
    params.push(...preferredLines);
  }
  
  sql += ' ORDER BY rating DESC LIMIT 10';
  
  let recommendations = db.prepare(sql).all(...params);
  
  const personalized = recommendations.map(r => ({
    id: r.id,
    poi_id: r.poi_id,
    name: r.name,
    description: r.discount_info || r.address,
    reason: preferredLines.includes(r.metro_line) ? '您常乘坐的线路附近' : '热门推荐',
    match_score: Math.floor(Math.random() * 30) + 70,
    exclusive_discount: userLevel >= 3 ? '会员专享额外9折' : null,
    image_url: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(r.name)}&image_size=square`,
    address: r.address,
    rating: r.rating,
    price: Math.floor(Math.random() * 200) + 50,
    tags: [r.category, r.metro_line],
  }));
  
  res.success({
    user_level: userLevel,
    preferred_lines: preferredLines,
    preferred_types: preferredTypes,
    list: personalized,
    total: personalized.length,
    user_id: req.user?.id || null
  }, '获取成功');
});

router.get('/events', (req, res) => {
  const events = [
    {
      id: 1,
      title: '天府通周年庆',
      description: '充值满100元送20元',
      start_date: '2026-06-01',
      end_date: '2026-06-30',
      category: 'promotion',
      status: 'active'
    },
    {
      id: 2,
      title: '地铁沿线美食节',
      description: '刷天府通享地铁沿线餐饮5折',
      start_date: '2026-06-10',
      end_date: '2026-07-10',
      category: 'food',
      status: 'active'
    },
    {
      id: 3,
      title: '积分兑换特惠',
      description: '积分兑换电影票立减200积分',
      start_date: '2026-06-15',
      end_date: '2026-06-25',
      category: 'points',
      status: 'upcoming'
    }
  ];
  
  res.success(events, '获取成功');
});

module.exports = router;
