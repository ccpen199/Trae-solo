const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const { merchant_id, keyword, page = 1, pageSize = 20 } = req.query;
  
  let query = 'SELECT * FROM products WHERE stock > 0';
  let params = [];

  if (merchant_id) {
    query += ' AND merchant_id = ?';
    params.push(merchant_id);
  }

  if (keyword) {
    query += ' AND name LIKE ?';
    params.push(`%${keyword}%`);
  }

  query += ' ORDER BY is_hot DESC, sales DESC';

  const offset = (page - 1) * pageSize;
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);

  try {
    const products = db.prepare(query).all(...params);
    res.json({
      success: true,
      data: products
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取商品失败' });
  }
});

router.get('/:id', (req, res) => {
  const { id } = req.params;

  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在' });
    }
    res.json({
      success: true,
      data: product
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取商品失败' });
  }
});

module.exports = router;
