const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const rows = db.prepare(`
    SELECT ss.*, u.name as student_name
    FROM school_schemes ss
    JOIN student_profiles sp ON ss.student_id = sp.id
    JOIN users u ON sp.user_id = u.id
    ORDER BY ss.created_at DESC
  `).all();
  res.json(rows);
});

router.get('/student/:studentId', authenticateToken, (req, res) => {
  const rows = db.prepare('SELECT * FROM school_schemes WHERE student_id = ? ORDER BY created_at DESC').all(req.params.studentId);
  res.json(rows);
});

router.post('/', authenticateToken, (req, res) => {
  const { student_id, school_name, major, application_round, deadline, difficulty_rating, consultant_suggestion } = req.body;
  
  try {
    if (!student_id) {
      return res.status(400).json({ error: '请选择学生' });
    }
    if (!school_name) {
      return res.status(400).json({ error: '请填写学校名称' });
    }
    if (!major) {
      return res.status(400).json({ error: '请填写专业' });
    }
    
    const student = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(student_id);
    if (!student) {
      return res.status(404).json({ error: '学生档案不存在' });
    }
    
    const result = db.prepare(`
      INSERT INTO school_schemes (student_id, school_name, major, application_round, deadline, difficulty_rating, consultant_suggestion, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(student_id, school_name, major, application_round, deadline, difficulty_rating, consultant_suggestion, req.user.id);
    
    res.json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (error) {
    console.error('创建选校方案失败:', error);
    res.status(500).json({ error: '创建失败: ' + error.message });
  }
});

router.put('/:id', authenticateToken, (req, res) => {
  const { school_name, major, application_round, deadline, difficulty_rating, consultant_suggestion } = req.body;
  
  try {
    const scheme = db.prepare('SELECT * FROM school_schemes WHERE id = ?').get(req.params.id);
    if (!scheme) {
      return res.status(404).json({ error: '选校方案不存在' });
    }
    
    if (scheme.status === 'confirmed') {
      return res.status(400).json({ error: '已确认的选校方案无法编辑' });
    }
    
    db.prepare(`
      UPDATE school_schemes 
      SET school_name = ?, major = ?, application_round = ?, deadline = ?, difficulty_rating = ?, consultant_suggestion = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(school_name, major, application_round, deadline, difficulty_rating, consultant_suggestion, req.params.id);
    
    res.json({ message: '更新成功' });
  } catch (error) {
    console.error('更新选校方案失败:', error);
    res.status(500).json({ error: '更新失败: ' + error.message });
  }
});

router.put('/:id/confirm', authenticateToken, (req, res) => {
  try {
    const scheme = db.prepare('SELECT * FROM school_schemes WHERE id = ?').get(req.params.id);
    if (!scheme) {
      return res.status(404).json({ error: '选校方案不存在' });
    }
    
    if (scheme.status === 'confirmed') {
      return res.status(400).json({ error: '该方案已确认，无需重复操作' });
    }
    
    db.prepare('UPDATE school_schemes SET status = "confirmed", confirmed_by = ?, confirmed_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(req.user.id, req.params.id);
    res.json({ message: '已确认' });
  } catch (error) {
    console.error('确认选校方案失败:', error);
    res.status(500).json({ error: '确认失败: ' + error.message });
  }
});

router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const scheme = db.prepare('SELECT * FROM school_schemes WHERE id = ?').get(req.params.id);
    if (!scheme) {
      return res.status(404).json({ error: '选校方案不存在' });
    }
    
    const hasApplication = db.prepare('SELECT * FROM applications WHERE scheme_id = ?').get(req.params.id);
    if (hasApplication) {
      return res.status(400).json({ error: '该选校方案已有申请记录，请先删除申请后再操作' });
    }
    
    db.prepare('DELETE FROM school_schemes WHERE id = ?').run(req.params.id);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除选校方案失败:', error);
    res.status(500).json({ error: '删除失败: ' + error.message });
  }
});

module.exports = router;
