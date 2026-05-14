const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const { category_id, keyword, sort = 'default', page = 1, pageSize = 20 } = req.query;
  
  let query = 'SELECT * FROM merchants WHERE is_open = 1';
  let params = [];

  if (category_id && category_id !== '1') {
    query += ' AND tags LIKE ?';
    params.push(`%${getCategoryName(category_id)}%`);
  }

  if (keyword) {
    query += ' AND (name LIKE ? OR tags LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  switch (sort) {
    case 'sales':
      query += ' ORDER BY sales DESC';
      break;
    case 'rating':
      query += ' ORDER BY rating DESC';
      break;
    case 'delivery_time':
      query += ' ORDER BY delivery_time ASC';
      break;
    case 'min_order':
      query += ' ORDER BY min_order ASC';
      break;
    case 'delivery_fee':
      query += ' ORDER BY delivery_fee ASC';
      break;
    default:
      query += ' ORDER BY id DESC';
  }

  const offset = (page - 1) * pageSize;
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);

  try {
    const merchants = db.prepare(query).all(...params);
    const count = db.prepare('SELECT COUNT(*) as count FROM merchants WHERE is_open = 1').get();
    
    res.json({
      success: true,
      data: merchants,
      total: count?.count || 0,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取商家列表失败' });
  }
});

function getCategoryName(id) {
  const names = {
    '2': '快餐便当',
    '3': '汉堡薯条',
    '4': '炸鸡烧烤',
    '5': '披萨意面',
    '6': '日韩料理',
    '7': '川湘菜',
    '8': '江浙菜',
    '9': '粤菜',
    '10': '甜品饮品',
    '11': '水果生鲜',
    '12': '早餐',
    '13': '夜宵',
    '14': '火锅',
    '15': '海鲜'
  };
  return names[id] || '';
}

router.get('/:id', (req, res) => {
  const { id } = req.params;

  try {
    const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(id);
    
    if (!merchant) {
      return res.status(404).json({ success: false, message: '商家不存在' });
    }

    const products = db.prepare('SELECT * FROM products WHERE merchant_id = ? ORDER BY is_hot DESC, sales DESC').all(id);

    res.json({
      success: true,
      data: {
        merchant,
        products
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取商家信息失败' });
  }
});

module.exports = router;
