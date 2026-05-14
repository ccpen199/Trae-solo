const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'token无效' });
    }
    req.userId = decoded.userId;
    next();
  });
}

router.get('/', authenticate, (req, res) => {
  try {
    const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(req.userId);
    res.json({ success: true, data: addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取地址失败' });
  }
});

router.get('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  
  try {
    const address = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(id, req.userId);
    if (!address) {
      return res.status(404).json({ success: false, message: '地址不存在' });
    }
    res.json({ success: true, data: address });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取地址失败' });
  }
});

router.post('/', authenticate, (req, res) => {
  const { name, phone, province, city, district, detail, is_default } = req.body;
  
  if (!name || !phone || !detail) {
    return res.status(400).json({ success: false, message: '请填写完整地址信息' });
  }

  try {
    if (is_default) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.userId);
    }
    
    const info = db.prepare('INSERT INTO addresses (user_id, name, phone, province, city, district, detail, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(req.userId, name, phone, province || '', city || '', district || '', detail, is_default ? 1 : 0);
    const address = db.prepare('SELECT * FROM addresses WHERE id = ?').get(info.lastInsertRowid);
    res.json({ success: true, message: '添加地址成功', data: address });
  } catch (err) {
    res.status(500).json({ success: false, message: '添加地址失败' });
  }
});

router.put('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { name, phone, province, city, district, detail, is_default } = req.body;

  try {
    if (is_default) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.userId);
    }
    
    db.prepare('UPDATE addresses SET name = ?, phone = ?, province = ?, city = ?, district = ?, detail = ?, is_default = ? WHERE id = ? AND user_id = ?').run(name, phone, province || '', city || '', district || '', detail, is_default ? 1 : 0, id, req.userId);
    const address = db.prepare('SELECT * FROM addresses WHERE id = ?').get(id);
    res.json({ success: true, message: '更新地址成功', data: address });
  } catch (err) {
    res.status(500).json({ success: false, message: '更新地址失败' });
  }
});

router.delete('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  
  try {
    db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(id, req.userId);
    res.json({ success: true, message: '删除地址成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '删除地址失败' });
  }
});

module.exports = router;
