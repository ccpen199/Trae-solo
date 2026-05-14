const db = require('../database/db');

const getCities = async (req, res) => {
  const { keyword, hot } = req.query;
  
  let query = 'SELECT * FROM cities WHERE 1=1';
  const params = [];
  
  if (hot === '1') {
    query += ' AND is_hot = 1';
  }
  
  if (keyword) {
    query += ' AND (name LIKE ? OR pinyin LIKE ? OR initial LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  
  query += ' ORDER BY is_hot DESC, pinyin ASC';
  
  const cities = db.prepare(query).all(...params);
  
  res.json({
    success: true,
    data: cities
  });
};

const getCityById = async (req, res) => {
  const { id } = req.params;
  const city = db.prepare('SELECT * FROM cities WHERE id = ?').get(id);
  
  if (!city) {
    return res.status(404).json({ success: false, message: '城市不存在' });
  }
  
  res.json({
    success: true,
    data: city
  });
};

const getDefaultCity = async (req, res) => {
  const city = db.prepare('SELECT * FROM cities WHERE is_hot = 1 ORDER BY id ASC LIMIT 1').get();
  
  res.json({
    success: true,
    data: city
  });
};

const getCurrentLocation = async (req, res) => {
  const user_id = req.user ? req.user.id : null;
  
  const defaultCity = db.prepare('SELECT * FROM cities WHERE is_hot = 1 ORDER BY id ASC LIMIT 1').get();
  
  let savedLocation = null;
  if (user_id) {
    savedLocation = db.prepare(`
      SELECT * FROM locations 
      WHERE user_id = ? AND type = 'home'
      ORDER BY created_at DESC 
      LIMIT 1
    `).get(user_id);
  }
  
  res.json({
    success: true,
    data: {
      city: defaultCity,
      location: savedLocation || {
        name: '当前位置',
        address: '北京市朝阳区望京SOHO',
        latitude: defaultCity.latitude + 0.005,
        longitude: defaultCity.longitude + 0.005
      }
    }
  });
};

const saveLocation = async (req, res) => {
  const { name, address, latitude, longitude, type } = req.body;
  const user_id = req.user.id;
  
  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, message: '经纬度不能为空' });
  }
  
  const id = require('uuid').v4();
  db.prepare(`
    INSERT INTO locations (id, user_id, name, address, latitude, longitude, type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, user_id, name || '保存的位置', address || '', latitude, longitude, type || 'saved');
  
  res.json({
    success: true,
    message: '位置已保存',
    data: { id, name, address, latitude, longitude, type }
  });
};

module.exports = {
  getCities,
  getCityById,
  getDefaultCity,
  getCurrentLocation,
  saveLocation
};