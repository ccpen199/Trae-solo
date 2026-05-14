const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT l.*, s.name as station_name, s.location as station_location FROM lost_items l LEFT JOIN service_stations s ON l.station_id = s.id WHERE 1=1';
    const params = [];
    
    if (category) {
      query += ' AND l.category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const items = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM lost_items' + (category ? ' WHERE category = ?' : '')).get(category ? [category] : []).count;
    
    res.json({ 
      success: true, 
      data: { 
        items: items.map(item => ({ ...item, images: item.images ? JSON.parse(item.images) : [] })), 
        total, 
        page: parseInt(page) 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败', error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const item = db.prepare('SELECT l.*, s.name as station_name, s.location as station_location, s.manager as station_manager, s.contact as station_contact FROM lost_items l LEFT JOIN service_stations s ON l.station_id = s.id WHERE l.id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: '物品不存在' });
    }
    
    db.prepare('UPDATE lost_items SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);
    
    res.json({ 
      success: true, 
      data: { 
        ...item, 
        images: item.images ? JSON.parse(item.images) : [],
        locker_location: null
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败', error: error.message });
  }
});

router.post('/:id/verify', (req, res) => {
  try {
    const { answer } = req.body;
    const item = db.prepare('SELECT * FROM lost_items WHERE id = ?').get(req.params.id);
    
    if (!item) {
      return res.status(404).json({ success: false, message: '物品不存在' });
    }
    
    if (item.verify_answer && answer !== item.verify_answer) {
      return res.status(400).json({ success: false, message: '验证答案错误' });
    }
    
    res.json({ success: true, data: { locker_location: item.locker_location } });
  } catch (error) {
    res.status(500).json({ success: false, message: '验证失败', error: error.message });
  }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const { title, description, category, images, contact_name, contact_phone, station_id, verify_question, verify_answer, locker_location } = req.body;
    
    const result = db.prepare(
      'INSERT INTO lost_items (user_id, title, description, category, images, contact_name, contact_phone, station_id, verify_question, verify_answer, locker_location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, title, description || '', category, JSON.stringify(images || []), contact_name || '', contact_phone || '', station_id || null, verify_question || '', verify_answer || '', locker_location || '');
    
    res.json({ success: true, data: { id: result.lastInsertRowid }, message: '发布成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '发布失败', error: error.message });
  }
});

module.exports = router;
