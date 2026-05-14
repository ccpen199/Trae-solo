const express = require('express');
const { db } = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  try {
    const locations = db.prepare('SELECT * FROM user_locations ORDER BY is_home DESC, is_work DESC, name').all();
    res.json({ success: true, data: locations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, address, is_home, is_work } = req.body;
    
    if (!name || !address) {
      return res.status(400).json({ success: false, message: '缺少名称或地址' });
    }

    const insertLoc = db.prepare(`
      INSERT INTO user_locations (name, address, is_home, is_work)
      VALUES (?, ?, ?, ?)
    `);

    const result = insertLoc.run(name, address, is_home ? 1 : 0, is_work ? 1 : 0);
    const location = db.prepare('SELECT * FROM user_locations WHERE id = ?').get(result.lastInsertRowid);
    
    res.json({ success: true, message: '位置已保存', data: location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM user_locations WHERE id = ?').run(id);
    res.json({ success: true, message: '位置已删除' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
