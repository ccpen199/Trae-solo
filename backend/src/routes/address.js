const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { query, queryOne, execute } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const addresses = await query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );

    res.json({ success: true, message: '获取成功', data: addresses });
  } catch (err) {
    console.error('获取地址列表失败:', err);
    res.json({ success: false, message: '获取失败', data: [] });
  }
});

router.get('/default', authMiddleware, async (req, res) => {
  try {
    const address = await queryOne(
      'SELECT * FROM addresses WHERE user_id = ? AND is_default = 1 LIMIT 1',
      [req.user.id]
    );

    res.json({ success: true, message: '获取成功', data: address });
  } catch (err) {
    console.error('获取默认地址失败:', err);
    res.json({ success: false, message: '获取失败', data: null });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, phone, province, city, district, detail, isDefault = false } = req.body;

    if (!name || !phone || !province || !city || !district || !detail) {
      return res.json({ success: false, message: '请填写完整的地址信息', data: null });
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    if (isDefault) {
      await execute('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }

    const existingAddresses = await queryOne(
      'SELECT COUNT(*) as count FROM addresses WHERE user_id = ?',
      [req.user.id]
    );
    const shouldBeDefault = existingAddresses.count === 0 ? 1 : (isDefault ? 1 : 0);

    await execute(
      'INSERT INTO addresses (id, user_id, name, phone, province, city, district, detail, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), req.user.id, name, phone, province, city, district, detail, shouldBeDefault, now]
    );

    res.json({ success: true, message: '添加成功', data: null });
  } catch (err) {
    console.error('添加地址失败:', err);
    res.json({ success: false, message: '添加失败', data: null });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, province, city, district, detail, isDefault } = req.body;

    const address = await queryOne(
      'SELECT * FROM addresses WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!address) {
      return res.json({ success: false, message: '地址不存在', data: null });
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    if (isDefault) {
      await execute('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }

    const updates = [];
    const params = [];

    if (typeof name !== 'undefined') { updates.push('name = ?'); params.push(name); }
    if (typeof phone !== 'undefined') { updates.push('phone = ?'); params.push(phone); }
    if (typeof province !== 'undefined') { updates.push('province = ?'); params.push(province); }
    if (typeof city !== 'undefined') { updates.push('city = ?'); params.push(city); }
    if (typeof district !== 'undefined') { updates.push('district = ?'); params.push(district); }
    if (typeof detail !== 'undefined') { updates.push('detail = ?'); params.push(detail); }
    if (typeof isDefault !== 'undefined') { updates.push('is_default = ?'); params.push(isDefault ? 1 : 0); }

    if (updates.length === 0) {
      return res.json({ success: false, message: '没有要更新的内容', data: null });
    }

    updates.push('updated_at = ?');
    params.push(now, id);

    await execute(`UPDATE addresses SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ success: true, message: '更新成功', data: null });
  } catch (err) {
    console.error('更新地址失败:', err);
    res.json({ success: false, message: '更新失败', data: null });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const address = await queryOne(
      'SELECT * FROM addresses WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!address) {
      return res.json({ success: false, message: '地址不存在', data: null });
    }

    await execute('DELETE FROM addresses WHERE id = ?', [id]);

    res.json({ success: true, message: '删除成功', data: null });
  } catch (err) {
    console.error('删除地址失败:', err);
    res.json({ success: false, message: '删除失败', data: null });
  }
});

module.exports = router;
