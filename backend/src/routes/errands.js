const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const items = db.prepare('SELECT * FROM errands ORDER BY created_at DESC LIMIT ? OFFSET ?').all(parseInt(limit), offset);
    const total = db.prepare('SELECT COUNT(*) as count FROM errands').get().count;
    
    res.json({ 
      success: true, 
      data: { 
        items: items.map(item => ({ ...item, tags: item.tags ? JSON.parse(item.tags) : [], restrictions: item.restrictions ? JSON.parse(item.restrictions) : [] })), 
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
    const item = db.prepare('SELECT * FROM errands WHERE id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: '跑腿不存在' });
    }
    
    db.prepare('UPDATE errands SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);
    
    res.json({ 
      success: true, 
      data: { 
        ...item, 
        tags: item.tags ? JSON.parse(item.tags) : [],
        restrictions: item.restrictions ? JSON.parse(item.restrictions) : []
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败', error: error.message });
  }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const { title, description, tags, location, reward, restrictions, contact_name, contact_phone } = req.body;
    
    const result = db.prepare(
      'INSERT INTO errands (user_id, title, description, tags, location, reward, restrictions, contact_name, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, title, description || '', JSON.stringify(tags || []), location || '', reward || 0, JSON.stringify(restrictions || []), contact_name || '', contact_phone || '');
    
    res.json({ success: true, data: { id: result.lastInsertRowid }, message: '发布成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '发布失败', error: error.message });
  }
});

module.exports = router;
