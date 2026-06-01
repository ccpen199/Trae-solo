const express = require('express');
const db = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    let settings = await db.get(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [req.user.userId]
    );

    if (!settings) {
      await db.run('INSERT INTO user_settings (user_id) VALUES (?)', [req.user.userId]);
      settings = await db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.userId]);
    }

    res.json({ settings });
  } catch (error) {
    console.error('获取设置错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.put('/', requireAuth, async (req, res) => {
  try {
    const { focusDuration, breakDuration, longBreakDuration, dailyReminder, appleHealthEnabled } = req.body;

    await db.run(
      `UPDATE user_settings 
       SET focus_duration = ?, break_duration = ?, long_break_duration = ?, daily_reminder = ?, apple_health_enabled = ?, updated_at = ?
       WHERE user_id = ?`,
      [focusDuration, breakDuration, longBreakDuration, dailyReminder, appleHealthEnabled ? 1 : 0, new Date().toISOString(), req.user.userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('更新设置错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
