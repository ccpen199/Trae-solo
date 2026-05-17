const express = require('express');
const { get, all } = require('../database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const symptoms = await all('SELECT * FROM symptoms ORDER BY id LIMIT ? OFFSET ?', [parseInt(limit), offset]);
    const total = await get('SELECT COUNT(*) as count FROM symptoms');

    res.json({ success: true, data: { list: symptoms, total: total.count, page: parseInt(page) } });
  } catch (error) {
    console.error('Get symptoms error:', error);
    res.status(500).json({ success: false, message: '获取症状列表失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const symptom = await get('SELECT * FROM symptoms WHERE id = ?', [req.params.id]);
    if (!symptom) {
      return res.status(404).json({ success: false, message: '症状不存在' });
    }
    res.json({ success: true, data: symptom });
  } catch (error) {
    console.error('Get symptom error:', error);
    res.status(500).json({ success: false, message: '获取症状详情失败' });
  }
});

module.exports = router;
