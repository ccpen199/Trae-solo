const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM secondhand_items WHERE status = ?';
    const params = ['active'];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const items = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM secondhand_items WHERE status = ?' + (category ? ' AND category = ?' : '')).get(category ? ['active', category] : ['active']).count;
    
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
    const item = db.prepare('SELECT * FROM secondhand_items WHERE id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: '物品不存在' });
    }
    
    db.prepare('UPDATE secondhand_items SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);
    
    res.json({ 
      success: true, 
      data: { 
        ...item, 
        images: item.images ? JSON.parse(item.images) : [] 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败', error: error.message });
  }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const { title, description, price, images, category, contact_name, contact_phone } = req.body;
    
    const result = db.prepare(
      'INSERT INTO secondhand_items (user_id, title, description, price, images, category, contact_name, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, title, description || '', price || 0, JSON.stringify(images || []), category || '', contact_name || '', contact_phone || '');
    
    res.json({ success: true, data: { id: result.lastInsertRowid }, message: '发布成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '发布失败', error: error.message });
  }
});

module.exports = router;
