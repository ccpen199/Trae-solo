const express = require('express');
const db = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const sounds = [
  { id: 'ocean', name: '海浪' },
  { id: 'forest', name: '森林' },
  { id: 'stream', name: '溪流' },
  { id: 'birds', name: '鸟鸣' },
];

router.get('/sounds', (req, res) => {
  res.json({ sounds });
});

router.post('/start', async (req, res) => {
  try {
    const { duration, breaths, sound } = req.body;
    const userId = req.user ? req.user.userId : null;

    const result = await db.run(
      'INSERT INTO breath_records (user_id, duration, breaths, start_time, sound) VALUES (?, ?, ?, ?, ?)',
      [userId, duration, breaths, new Date().toISOString(), sound || null]
    );

    res.status(201).json({
      recordId: result.lastID,
      startTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('开始呼吸错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/history', requireAuth, async (req, res) => {
  try {
    const records = await db.all(
      'SELECT * FROM breath_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.userId]
    );
    res.json({ records });
  } catch (error) {
    console.error('获取呼吸历史错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
