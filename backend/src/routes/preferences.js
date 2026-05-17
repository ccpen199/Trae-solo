const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    let preferences = await db.get(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [userId]
    );

    if (!preferences) {
      await db.run(
        'INSERT INTO user_preferences (user_id, preferred_music_categories) VALUES (?, ?)',
        [userId, '["nature","piano"]']
      );
      preferences = await db.get(
        'SELECT * FROM user_preferences WHERE user_id = ?',
        [userId]
      );
    }

    const user = await db.get(
      'SELECT id, username, email, nickname, avatar, age, gender FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      data: {
        preferences,
        user
      },
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取偏好设置错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      preferredMusicCategories,
      sleepGoalHours,
      wakeUpTime,
      bedTime,
      notificationsEnabled,
      autoStopMusic,
      smartDeviceEnabled
    } = req.body;

    const existing = await db.get(
      'SELECT id FROM user_preferences WHERE user_id = ?',
      [userId]
    );

    if (existing) {
      await db.run(`
        UPDATE user_preferences 
        SET preferred_music_categories = ?, sleep_goal_hours = ?, wake_up_time = ?, 
            bed_time = ?, notifications_enabled = ?, auto_stop_music = ?, 
            smart_device_enabled = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [
        preferredMusicCategories || null,
        sleepGoalHours || 8,
        wakeUpTime || null,
        bedTime || null,
        notificationsEnabled !== undefined ? notificationsEnabled : 1,
        autoStopMusic !== undefined ? autoStopMusic : 1,
        smartDeviceEnabled !== undefined ? smartDeviceEnabled : 1,
        userId
      ]);
    } else {
      await db.run(`
        INSERT INTO user_preferences 
        (user_id, preferred_music_categories, sleep_goal_hours, wake_up_time, 
         bed_time, notifications_enabled, auto_stop_music, smart_device_enabled)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        preferredMusicCategories || '["nature","piano"]',
        sleepGoalHours || 8,
        wakeUpTime || null,
        bedTime || null,
        notificationsEnabled !== undefined ? notificationsEnabled : 1,
        autoStopMusic !== undefined ? autoStopMusic : 1,
        smartDeviceEnabled !== undefined ? smartDeviceEnabled : 1
      ]);
    }

    res.json({
      success: true,
      message: '设置已保存'
    });
  } catch (error) {
    console.error('保存偏好设置错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { nickname, age, gender } = req.body;

    await db.run(`
      UPDATE users 
      SET nickname = ?, age = ?, gender = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [nickname || null, age || null, gender || null, userId]);

    res.json({
      success: true,
      message: '资料已更新'
    });
  } catch (error) {
    console.error('更新用户资料错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
