const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/stations', (req, res) => {
  try {
    const stations = db.prepare('SELECT * FROM service_stations WHERE status = 1').all();
    res.json({ success: true, data: stations });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败', error: error.message });
  }
});

router.get('/stations/:id', (req, res) => {
  try {
    const station = db.prepare('SELECT * FROM service_stations WHERE id = ?').get(req.params.id);
    if (!station) {
      return res.status(404).json({ success: false, message: '服务站不存在' });
    }
    
    const items = db.prepare('SELECT * FROM lost_items WHERE station_id = ? AND status = ?').all(req.params.id, 'pending');
    
    res.json({ 
      success: true, 
      data: { 
        ...station, 
        items: items.map(item => ({ ...item, images: item.images ? JSON.parse(item.images) : [] }))
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败', error: error.message });
  }
});

module.exports = router;
