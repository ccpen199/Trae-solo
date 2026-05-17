import express from 'express';
import { getDB } from '../db/index.js';

const router = express.Router();
const db = getDB();

router.get('/', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users').all();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: '获取用户列表失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
});

router.get('/:id/stats', (req, res) => {
  try {
    const { id } = req.params;
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const weekStats = db.prepare(`
      SELECT 
        COUNT(*) as workout_count,
        COALESCE(SUM(duration), 0) as total_duration,
        COALESCE(SUM(calories), 0) as total_calories
      FROM exercise_records 
      WHERE user_id = ? AND recorded_at >= datetime('now', '-7 days')
    `).get(id);

    const recentRecords = db.prepare(`
      SELECT * FROM exercise_records 
      WHERE user_id = ? 
      ORDER BY recorded_at DESC 
      LIMIT 10
    `).all(id);

    res.json({ 
      success: true, 
      data: {
        user,
        week_stats: weekStats,
        recent_records: recentRecords
      } 
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ success: false, message: '获取用户统计失败' });
  }
});

router.post('/:id/record', (req, res) => {
  try {
    const { id } = req.params;
    const { duration, calories, exercise_type } = req.body;

    if (!duration) {
      return res.status(400).json({ success: false, message: '缺少运动时长' });
    }

    const stmt = db.prepare(`
      INSERT INTO exercise_records (user_id, duration, calories, exercise_type)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(id, duration, calories || 0, exercise_type || 'general');

    db.prepare(`
      UPDATE users 
      SET total_duration = total_duration + ?, total_calories = total_calories + ?
      WHERE id = ?
    `).run(duration, calories || 0, id);

    const record = db.prepare('SELECT * FROM exercise_records WHERE id = ?').get(result.lastInsertRowid);
    
    res.json({ success: true, data: record });
  } catch (error) {
    console.error('Record exercise error:', error);
    res.status(500).json({ success: false, message: '记录运动失败' });
  }
});

export default router;
