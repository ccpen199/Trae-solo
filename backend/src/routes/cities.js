const express = require('express');
const router = express.Router();
const db = require('../database/connection');

router.get('/', (req, res) => {
  try {
    const { hot } = req.query;
    let query = 'SELECT * FROM cities ORDER BY is_hot DESC, name ASC';
    let params = [];
    
    if (hot === 'true') {
      query = 'SELECT * FROM cities WHERE is_hot = 1 ORDER BY name ASC';
    }
    
    const cities = db.prepare(query).all(...params);
    res.json({ success: true, data: cities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const city = db.prepare('SELECT * FROM cities WHERE id = ?').get(req.params.id);
    if (!city) {
      return res.status(404).json({ success: false, message: '城市不存在' });
    }
    res.json({ success: true, data: city });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/locate', (req, res) => {
  try {
    const { latitude, longitude, gpsAvailable } = req.body;
    
    if (gpsAvailable === false) {
      return res.json({ 
        success: true, 
        data: { id: 1, name: '北京' },
        warning: 'GPS不可用，已默认定位到北京'
      });
    }
    
    if (!latitude || !longitude) {
      return res.json({ 
        success: true, 
        data: { id: 1, name: '北京' },
        warning: '无法获取位置信息，已默认定位到北京'
      });
    }
    
    const cities = db.prepare('SELECT * FROM cities').all();
    let nearestCity = cities[0];
    let minDistance = Infinity;
    
    cities.forEach(city => {
      if (city.latitude && city.longitude) {
        const distance = Math.sqrt(
          Math.pow(city.latitude - latitude, 2) + 
          Math.pow(city.longitude - longitude, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestCity = city;
        }
      }
    });
    
    res.json({ 
      success: true, 
      data: nearestCity,
      message: '定位成功'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
