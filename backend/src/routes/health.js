const express = require('express');
const { get, all, run } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { pet_id } = req.query;
    let sql = `
      SELECT h.*, p.name as pet_name 
      FROM health_records h
      JOIN pets p ON h.pet_id = p.id
      WHERE h.user_id = ?
    `;
    const params = [req.user.id];

    if (pet_id) {
      sql += ' AND h.pet_id = ?';
      params.push(pet_id);
    }

    sql += ' ORDER BY h.record_date DESC';

    const records = await all(sql, params);
    res.json({ success: true, data: records });
  } catch (error) {
    console.error('Get health records error:', error);
    res.status(500).json({ success: false, message: '获取健康记录失败' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const record = await get('SELECT * FROM health_records WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!record) {
      return res.status(404).json({ success: false, message: '记录不存在' });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    console.error('Get health record error:', error);
    res.status(500).json({ success: false, message: '获取记录详情失败' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { pet_id, title, content, images, tags, record_date, type } = req.body;

    if (!pet_id || !title || !record_date) {
      return res.status(400).json({ success: false, message: '宠物ID、标题和记录日期不能为空' });
    }

    const pet = await get('SELECT id FROM pets WHERE id = ? AND user_id = ?', [pet_id, req.user.id]);
    if (!pet) {
      return res.status(404).json({ success: false, message: '宠物不存在' });
    }

    const result = await run(`
      INSERT INTO health_records (pet_id, user_id, title, content, images, tags, record_date, type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [pet_id, req.user.id, title, content || '', images || '', tags || '', record_date, type || 'normal']);

    res.json({ success: true, data: { id: result.lastID }, message: '添加成功' });
  } catch (error) {
    console.error('Create health record error:', error);
    res.status(500).json({ success: false, message: '添加失败' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, content, images, tags, record_date, type } = req.body;

    const record = await get('SELECT id FROM health_records WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!record) {
      return res.status(404).json({ success: false, message: '记录不存在' });
    }

    await run(`
      UPDATE health_records SET title = ?, content = ?, images = ?, tags = ?, record_date = ?, type = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [title, content || '', images || '', tags || '', record_date, type || 'normal', req.params.id]);

    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('Update health record error:', error);
    res.status(500).json({ success: false, message: '更新失败' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const record = await get('SELECT id FROM health_records WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!record) {
      return res.status(404).json({ success: false, message: '记录不存在' });
    }

    await run('DELETE FROM health_records WHERE id = ?', [req.params.id]);

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete health record error:', error);
    res.status(500).json({ success: false, message: '删除失败' });
  }
});

module.exports = router;
