const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/list', authMiddleware, (req, res) => {
  try {
    const addresses = db.prepare(`
      SELECT id, name, phone, province, city, district, detail, is_default
      FROM addresses
      WHERE user_id = ?
      ORDER BY is_default DESC, created_at DESC
    `).all(req.user.id);
    
    res.json({ success: true, data: addresses });
  } catch (error) {
    console.error('获取地址列表失败:', error);
    res.status(500).json({ success: false, message: '获取地址列表失败' });
  }
});

router.get('/default', authMiddleware, (req, res) => {
  try {
    const address = db.prepare(`
      SELECT id, name, phone, province, city, district, detail, is_default
      FROM addresses
      WHERE user_id = ? AND is_default = 1
    `).get(req.user.id);
    
    res.json({ success: true, data: address || null });
  } catch (error) {
    console.error('获取默认地址失败:', error);
    res.status(500).json({ success: false, message: '获取默认地址失败' });
  }
});

router.post('/create', authMiddleware, (req, res) => {
  try {
    const { name, phone, province, city, district, detail, is_default = false } = req.body;
    
    if (!name || !phone || !detail) {
      return res.status(400).json({ success: false, message: '请填写完整地址信息' });
    }
    
    const transaction = db.transaction(() => {
      if (is_default) {
        db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
      }
      
      const result = db.prepare(`
        INSERT INTO addresses (user_id, name, phone, province, city, district, detail, is_default)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(req.user.id, name, phone, province || '', city || '', district || '', detail, is_default ? 1 : 0);
      
      return result.lastInsertRowid;
    });
    
    const addressId = transaction();
    
    res.json({
      success: true,
      message: '地址添加成功',
      data: { id: addressId }
    });
  } catch (error) {
    console.error('添加地址失败:', error);
    res.status(500).json({ success: false, message: '添加地址失败' });
  }
});

router.put('/update/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, province, city, district, detail, is_default } = req.body;
    
    const address = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(id, req.user.id);
    
    if (!address) {
      return res.status(404).json({ success: false, message: '地址不存在' });
    }
    
    const transaction = db.transaction(() => {
      const updateFields = [];
      const values = [];
      
      if (name !== undefined) {
        updateFields.push('name = ?');
        values.push(name);
      }
      if (phone !== undefined) {
        updateFields.push('phone = ?');
        values.push(phone);
      }
      if (province !== undefined) {
        updateFields.push('province = ?');
        values.push(province);
      }
      if (city !== undefined) {
        updateFields.push('city = ?');
        values.push(city);
      }
      if (district !== undefined) {
        updateFields.push('district = ?');
        values.push(district);
      }
      if (detail !== undefined) {
        updateFields.push('detail = ?');
        values.push(detail);
      }
      
      if (is_default === true) {
        db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
        updateFields.push('is_default = 1');
      } else if (is_default === false) {
        updateFields.push('is_default = 0');
      }
      
      if (updateFields.length > 0) {
        values.push(id);
        db.prepare(`UPDATE addresses SET ${updateFields.join(', ')} WHERE id = ?`).run(...values);
      }
    });
    
    transaction();
    
    res.json({
      success: true,
      message: '地址更新成功'
    });
  } catch (error) {
    console.error('更新地址失败:', error);
    res.status(500).json({ success: false, message: '更新地址失败' });
  }
});

router.delete('/delete/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    
    const address = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(id, req.user.id);
    
    if (!address) {
      return res.status(404).json({ success: false, message: '地址不存在' });
    }
    
    db.prepare('DELETE FROM addresses WHERE id = ?').run(id);
    
    res.json({
      success: true,
      message: '地址已删除'
    });
  } catch (error) {
    console.error('删除地址失败:', error);
    res.status(500).json({ success: false, message: '删除地址失败' });
  }
});

router.put('/set-default/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    
    const address = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(id, req.user.id);
    
    if (!address) {
      return res.status(404).json({ success: false, message: '地址不存在' });
    }
    
    const transaction = db.transaction(() => {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
      db.prepare('UPDATE addresses SET is_default = 1 WHERE id = ?').run(id);
    });
    
    transaction();
    
    res.json({
      success: true,
      message: '已设为默认地址'
    });
  } catch (error) {
    console.error('设置默认地址失败:', error);
    res.status(500).json({ success: false, message: '设置默认地址失败' });
  }
});

module.exports = router;
