const express = require('express');
const db = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const sounds = [
  { id: 'rain', name: '雨声', category: 'nature', duration: 0 },
  { id: 'ocean', name: '海洋', category: 'nature', duration: 0 },
  { id: 'forest', name: '森林', category: 'nature', duration: 0 },
  { id: 'thunder', name: '雷声', category: 'nature', duration: 0 },
  { id: 'wind', name: '风声', category: 'nature', duration: 0 },
  { id: 'fire', name: '篝火', category: 'nature', duration: 0 },
  { id: 'meditation', name: '冥想', category: 'music', duration: 0 },
  { id: 'piano', name: '钢琴', category: 'music', duration: 0 },
];

router.get('/sounds', (req, res) => {
  res.json({ sounds });
});

router.post('/start', async (req, res) => {
  try {
    const { type, duration, sound, wakeTask } = req.body;
    const userId = req.user ? req.user.userId : null;

    const result = await db.run(
      'INSERT INTO sleep_records (user_id, type, duration, start_time, sound, wake_task) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, type, duration, new Date().toISOString(), sound || null, wakeTask || null]
    );

    res.status(201).json({
      recordId: result.lastID,
      startTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('开始睡眠错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run(
      'UPDATE sleep_records SET end_time = ? WHERE id = ?',
      [new Date().toISOString(), id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('完成睡眠错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/history', requireAuth, async (req, res) => {
  try {
    const records = await db.all(
      'SELECT * FROM sleep_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.userId]
    );
    res.json({ records });
  } catch (error) {
    console.error('获取睡眠历史错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
