const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { authMiddleware } = require('../middleware/auth');

router.get('/cities', (req, res) => {
  const hotCities = db.prepare(
    'SELECT * FROM cities WHERE is_hot = 1 ORDER BY sort_order'
  ).all();
  
  const allCities = db.prepare(
    'SELECT * FROM cities ORDER BY province, name'
  ).all();
  
  const citiesByProvince = {};
  allCities.forEach(city => {
    const province = city.province || '其他';
    if (!citiesByProvince[province]) {
      citiesByProvince[province] = [];
    }
    citiesByProvince[province].push(city);
  });
  
  res.json({
    code: 0,
    data: {
      hotCities,
      citiesByProvince
    }
  });
});

router.get('/', authMiddleware, (req, res) => {
  const userId = req.user.id;
  
  const addresses = db.prepare(
    'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC'
  ).all(userId);
  
  res.json({ code: 0, data: addresses });
});

router.get('/default', authMiddleware, (req, res) => {
  const userId = req.user.id;
  
  const defaultAddress = db.prepare(
    'SELECT * FROM addresses WHERE user_id = ? AND is_default = 1'
  ).get(userId);
  
  if (defaultAddress) {
    return res.json({ code: 0, data: defaultAddress });
  }
  
  const firstAddress = db.prepare(
    'SELECT * FROM addresses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
  ).get(userId);
  
  res.json({ code: 0, data: firstAddress || null });
});

router.post('/', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { name, phone, province, city, district, address, is_default = false, latitude, longitude } = req.body;
  
  if (!name || !phone || !city || !address) {
    return res.status(400).json({ code: 400, message: '请填写完整的地址信息' });
  }
  
  if (is_default) {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(userId);
  }
  
  const result = db.prepare(`
    INSERT INTO addresses (user_id, name, phone, province, city, district, address, is_default, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, name, phone, province, city, district, address, is_default ? 1 : 0, latitude, longitude);
  
  res.json({
    code: 0,
    message: '添加成功',
    data: { id: result.lastInsertRowid }
  });
});

router.put('/:id', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { name, phone, province, city, district, address, is_default, latitude, longitude } = req.body;
  
  const existing = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(id, userId);
  
  if (!existing) {
    return res.status(404).json({ code: 404, message: '地址不存在' });
  }
  
  if (is_default) {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(userId);
  }
  
  const updates = [];
  const values = [];
  
  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
  if (province !== undefined) { updates.push('province = ?'); values.push(province); }
  if (city !== undefined) { updates.push('city = ?'); values.push(city); }
  if (district !== undefined) { updates.push('district = ?'); values.push(district); }
  if (address !== undefined) { updates.push('address = ?'); values.push(address); }
  if (is_default !== undefined) { updates.push('is_default = ?'); values.push(is_default ? 1 : 0); }
  if (latitude !== undefined) { updates.push('latitude = ?'); values.push(latitude); }
  if (longitude !== undefined) { updates.push('longitude = ?'); values.push(longitude); }
  
  values.push(id, userId);
  
  db.prepare(`UPDATE addresses SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
  
  res.json({ code: 0, message: '更新成功' });
});

router.delete('/:id', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  
  const result = db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(id, userId);
  
  if (result.changes === 0) {
    return res.status(404).json({ code: 404, message: '地址不存在' });
  }
  
  res.json({ code: 0, message: '删除成功' });
});

router.put('/:id/default', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  
  const existing = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(id, userId);
  
  if (!existing) {
    return res.status(404).json({ code: 404, message: '地址不存在' });
  }
  
  db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(userId);
  db.prepare('UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?').run(id, userId);
  
  res.json({ code: 0, message: '设置成功' });
});

module.exports = router;
