const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  try {
    const query = `
      SELECT sp.*, u.name, u.email, u.phone
      FROM student_profiles sp
      JOIN users u ON sp.user_id = u.id
    `;
    
    const rows = db.prepare(query).all();
    res.json(rows);
  } catch (error) {
    console.error('获取学生列表失败:', error);
    res.status(500).json({ error: '获取失败: ' + error.message });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const row = db.prepare(`
      SELECT sp.*, u.name, u.email, u.phone
      FROM student_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.id = ?
    `).get(req.params.id);
    
    if (!row) {
      return res.status(404).json({ error: '学生档案不存在' });
    }
    
    res.json(row);
  } catch (error) {
    console.error('获取学生档案失败:', error);
    res.status(500).json({ error: '获取失败: ' + error.message });
  }
});

router.put('/:id', authenticateToken, (req, res) => {
  const { gpa, gre, gmat, toefl, ielts, background_activities, target_countries, budget, application_season } = req.body;
  
  try {
    const profile = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: '学生档案不存在' });
    }
    
    db.prepare(`
      UPDATE student_profiles 
      SET gpa = ?, gre = ?, gmat = ?, toefl = ?, ielts = ?, background_activities = ?, 
          target_countries = ?, budget = ?, application_season = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(gpa, gre, gmat, toefl, ielts, background_activities, target_countries, budget, application_season, req.params.id);
    
    res.json({ message: '更新成功' });
  } catch (error) {
    console.error('更新学生档案失败:', error);
    res.status(500).json({ error: '更新失败: ' + error.message });
  }
});

module.exports = router;
