const express = require('express');
const db = require('../database/db');
const { logOperation, logException } = require('../middleware/audit');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { category, is_active } = req.query;
    let sql = 'SELECT * FROM rules WHERE 1=1';
    const params = [];
    
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (is_active !== undefined) {
      sql += ' AND is_active = ?';
      params.push(is_active === 'true' ? 1 : 0);
    }
    sql += ' ORDER BY created_at DESC';
    
    const rules = db.prepare(sql).all(...params);
    res.json({ success: true, data: rules });
  } catch (error) {
    logException(null, null, 'get_rules', req.query, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const rule = db.prepare('SELECT * FROM rules WHERE id = ?').get(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, error: '规则不存在' });
    }
    res.json({ success: true, data: rule });
  } catch (error) {
    logException(null, null, 'get_rule', req.params, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
