const express = require('express');
const { get, all, run } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const pets = await all('SELECT * FROM pets WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json({ success: true, data: pets });
  } catch (error) {
    console.error('Get pets error:', error);
    res.status(500).json({ success: false, message: '获取宠物列表失败' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const pet = await get('SELECT * FROM pets WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!pet) {
      return res.status(404).json({ success: false, message: '宠物不存在' });
    }
    res.json({ success: true, data: pet });
  } catch (error) {
    console.error('Get pet error:', error);
    res.status(500).json({ success: false, message: '获取宠物详情失败' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, species, breed, age, gender, sterilized, registration_number, weight, description, photo } = req.body;

    if (!name || !species) {
      return res.status(400).json({ success: false, message: '宠物名称和物种不能为空' });
    }

    const result = await run(`
      INSERT INTO pets (user_id, name, species, breed, age, gender, sterilized, registration_number, weight, description, photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.user.id, name, species, breed || '', age || null, gender || '公', sterilized ? 1 : 0, registration_number || '', weight || null, description || '', photo || '']);

    res.json({ success: true, data: { id: result.lastID }, message: '添加成功' });
  } catch (error) {
    console.error('Create pet error:', error);
    res.status(500).json({ success: false, message: '添加失败' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, species, breed, age, gender, sterilized, registration_number, weight, description, photo } = req.body;

    const pet = await get('SELECT id FROM pets WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!pet) {
      return res.status(404).json({ success: false, message: '宠物不存在' });
    }

    await run(`
      UPDATE pets SET name = ?, species = ?, breed = ?, age = ?, gender = ?, sterilized = ?, 
      registration_number = ?, weight = ?, description = ?, photo = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, species, breed || '', age || null, gender || '公', sterilized ? 1 : 0, registration_number || '', weight || null, description || '', photo || '', req.params.id]);

    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('Update pet error:', error);
    res.status(500).json({ success: false, message: '更新失败' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const pet = await get('SELECT id FROM pets WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!pet) {
      return res.status(404).json({ success: false, message: '宠物不存在' });
    }

    await run('DELETE FROM health_records WHERE pet_id = ?', [req.params.id]);
    await run('DELETE FROM pets WHERE id = ?', [req.params.id]);

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete pet error:', error);
    res.status(500).json({ success: false, message: '删除失败' });
  }
});

module.exports = router;
