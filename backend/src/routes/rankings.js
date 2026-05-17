import express from 'express';
import { getDB } from '../db/index.js';

const router = express.Router();
const db = getDB();

router.get('/', (req, res) => {
  try {
    const { period = 'week', category = 'duration', limit = 50 } = req.query;
    
    const validPeriods = ['day', 'week', 'month', 'all'];
    const validCategories = ['duration', 'calories', 'level'];
    
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ success: false, message: '无效的时间范围' });
    }
    if (!validCategories.includes(category)) {
      return res.status(400).json({ success: false, message: '无效的排名类型' });
    }

    let orderField = category === 'duration' ? 'total_duration' : 
                     category === 'calories' ? 'total_calories' : 'level';
    
    const rankings = db.prepare(`
      SELECT 
        u.id,
        u.name,
        u.avatar,
        u.${orderField} as value,
        ROW_NUMBER() OVER (ORDER BY u.${orderField} DESC) as rank
      FROM users u
      ORDER BY u.${orderField} DESC
      LIMIT ?
    `).all(limit);

    res.json({ 
      success: true, 
      data: {
        period,
        category,
        rankings
      } 
    });
  } catch (error) {
    console.error('Get rankings error:', error);
    res.status(500).json({ success: false, message: '获取排行榜失败' });
  }
});

router.get('/user/:user_id', (req, res) => {
  try {
    const { user_id } = req.params;
    const { category = 'duration' } = req.query;
    
    let orderField = category === 'duration' ? 'total_duration' : 
                     category === 'calories' ? 'total_calories' : 'level';

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const result = db.prepare(`
      SELECT 
        COUNT(*) + 1 as rank
      FROM users u2
      WHERE u2.${orderField} > (SELECT ${orderField} FROM users WHERE id = ?)
    `).get(user_id);

    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

    res.json({ 
      success: true, 
      data: {
        user_id,
        rank: result.rank,
        total_users: totalUsers,
        value: user[orderField],
        category
      } 
    });
  } catch (error) {
    console.error('Get user ranking error:', error);
    res.status(500).json({ success: false, message: '获取用户排名失败' });
  }
});

export default router;
