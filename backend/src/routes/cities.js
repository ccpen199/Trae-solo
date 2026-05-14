const express = require('express');
const { db } = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  try {
    const cities = db.prepare('SELECT * FROM cities ORDER BY name').all();
    res.json({ success: true, data: cities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/landmarks', (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    
    let query = 'SELECT * FROM landmarks WHERE city_id = ?';
    const params = [id];
    
    if (type === 'nearby') {
      query += ' AND is_nearby = 1';
    }
    
    query += ' ORDER BY name';
    
    const landmarks = db.prepare(query).all(...params);
    res.json({ success: true, data: landmarks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
