const express = require('express');
const db = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/start', async (req, res) => {
  try {
    const { duration, mode = 'normal' } = req.body;
    const userId = req.user ? req.user.userId : null;

    const result = await db.run(
      'INSERT INTO focus_records (user_id, duration, start_time, mode) VALUES (?, ?, ?, ?)',
      [userId, duration, new Date().toISOString(), mode]
    );

    res.status(201).json({
      recordId: result.lastID,
      startTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('开始专注错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run(
      'UPDATE focus_records SET end_time = ?, completed = 1 WHERE id = ?',
      [new Date().toISOString(), id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('完成专注错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/history', requireAuth, async (req, res) => {
  try {
    const records = await db.all(
      'SELECT * FROM focus_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.userId]
    );
    res.json({ records });
  } catch (error) {
    console.error('获取专注历史错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/stats', requireAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.get(
      `SELECT COUNT(*) as count, SUM(duration) as totalDuration 
       FROM focus_records 
       WHERE user_id = ? AND DATE(start_time) = ? AND completed = 1`,
      [req.user.userId, today]
    );
    res.json({
      todayCount: result.count || 0,
      todayDuration: result.totalDuration || 0
    });
  } catch (error) {
    console.error('获取专注统计错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
