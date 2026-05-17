const express = require('express');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/daily', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const rankings = db.prepare(`
      SELECT u.id, u.nickname, u.avatar, 
             SUM(tr.duration) as total_minutes,
             SUM(tr.calories) as total_calories,
             COUNT(*) as workout_count
      FROM training_records tr
      JOIN users u ON tr.user_id = u.id
      WHERE tr.training_date = ?
      GROUP BY tr.user_id
      ORDER BY total_minutes DESC
      LIMIT 50
    `).all(today);

    res.json({ success: true, data: rankings });
  } catch (error) {
    console.error('获取日排行榜错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/weekly', (req, res) => {
  try {
    const rankings = db.prepare(`
      SELECT u.id, u.nickname, u.avatar, 
             SUM(tr.duration) as total_minutes,
             SUM(tr.calories) as total_calories,
             COUNT(*) as workout_count
      FROM training_records tr
      JOIN users u ON tr.user_id = u.id
      WHERE tr.training_date >= DATE('now', '-7 days')
      GROUP BY tr.user_id
      ORDER BY total_minutes DESC
      LIMIT 50
    `).all();

    res.json({ success: true, data: rankings });
  } catch (error) {
    console.error('获取周排行榜错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/monthly', (req, res) => {
  try {
    const rankings = db.prepare(`
      SELECT u.id, u.nickname, u.avatar, 
             SUM(tr.duration) as total_minutes,
             SUM(tr.calories) as total_calories,
             COUNT(*) as workout_count
      FROM training_records tr
      JOIN users u ON tr.user_id = u.id
      WHERE tr.training_date >= DATE('now', '-30 days')
      GROUP BY tr.user_id
      ORDER BY total_minutes DESC
      LIMIT 50
    `).all();

    res.json({ success: true, data: rankings });
  } catch (error) {
    console.error('获取月排行榜错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/record', authenticateToken, (req, res) => {
  try {
    const { activity_type, duration, calories, distance } = req.body;
    const today = new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO training_records (user_id, activity_type, duration, calories, distance, training_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, activity_type || '跑步', duration || 0, calories || 0, distance || 0, today);

    db.prepare('UPDATE users SET total_training_minutes = total_training_minutes + ? WHERE id = ?').run(duration || 0, req.user.id);

    res.json({ success: true, message: '记录已保存' });
  } catch (error) {
    console.error('保存训练记录错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/my-stats', authenticateToken, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const todayStats = db.prepare(`
      SELECT SUM(duration) as minutes, SUM(calories) as calories
      FROM training_records
      WHERE user_id = ? AND training_date = ?
    `).get(req.user.id, today);

    const weekStats = db.prepare(`
      SELECT SUM(duration) as minutes, SUM(calories) as calories
      FROM training_records
      WHERE user_id = ? AND training_date >= DATE('now', '-7 days')
    `).get(req.user.id);

    const monthStats = db.prepare(`
      SELECT SUM(duration) as minutes, SUM(calories) as calories
      FROM training_records
      WHERE user_id = ? AND training_date >= DATE('now', '-30 days')
    `).get(req.user.id);

    res.json({
      success: true,
      data: {
        today: { minutes: todayStats.minutes || 0, calories: todayStats.calories || 0 },
        week: { minutes: weekStats.minutes || 0, calories: weekStats.calories || 0 },
        month: { minutes: monthStats.minutes || 0, calories: monthStats.calories || 0 }
      }
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
