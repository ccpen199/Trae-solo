const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../database/init');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  try {
    const products = db.prepare("SELECT * FROM products WHERE status = 'active' ORDER BY created_at DESC").all();
    res.json({ success: true, data: products || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '获取产品列表失败' });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '获取产品详情失败' });
  }
});

module.exports = router;
