const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', authenticateToken, requireRole(['jobseeker']), (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user.id);
    if (profile) {
      const skills = db.prepare('SELECT skill FROM jobseeker_skills WHERE jobseeker_id = ?').all(profile.id);
      profile.skills = skills.map(s => s.skill);
    }
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: '获取个人信息失败' });
  }
});

router.put('/profile', authenticateToken, requireRole(['jobseeker']), (req, res) => {
  const { name, gender, age, phone, skills, expectedSalaryMin, expectedSalaryMax, availableDate, location, commuteRadius, workExperience, education } = req.body;

  try {
    const profile = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user.id);
    
    db.prepare(`
      UPDATE jobseekers 
      SET name = ?, gender = ?, age = ?, phone = ?, expected_salary_min = ?, expected_salary_max = ?, available_date = ?, location = ?, commute_radius = ?, work_experience = ?, education = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(name, gender || '', age || 0, phone || '', expectedSalaryMin || 0, expectedSalaryMax || 0, availableDate || '', location || '', commuteRadius || null, workExperience || '', education || '', req.user.id);

    db.prepare('DELETE FROM jobseeker_skills WHERE jobseeker_id = ?').run(profile.id);
    const insertSkill = db.prepare('INSERT INTO jobseeker_skills (jobseeker_id, skill) VALUES (?, ?)');
    (skills || []).forEach(skill => {
      if (skill.trim()) {
        insertSkill.run(profile.id, skill.trim());
      }
    });

    res.json({ message: '个人信息更新成功' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: '更新个人信息失败' });
  }
});

router.get('/credit-records', authenticateToken, requireRole(['jobseeker']), (req, res) => {
  try {
    const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user.id);
    if (!jobseeker) {
      return res.status(404).json({ error: '求职者信息不存在' });
    }

    const records = db.prepare(`
      SELECT * FROM credit_records 
      WHERE jobseeker_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(jobseeker.id);

    res.json({ records });
  } catch (error) {
    console.error('Get credit records error:', error);
    res.status(500).json({ error: '获取信用记录失败' });
  }
});

router.get('/', authenticateToken, requireRole(['employer', 'admin']), (req, res) => {
  const { page = 1, limit = 20, keyword, skills } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM jobseekers WHERE 1=1';
  const params = [];

  if (keyword) {
    query += ' AND (name LIKE ? OR skills LIKE ? OR work_experience LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  try {
    const jobseekers = db.prepare(query).all(...params);
    const countResult = db.prepare('SELECT COUNT(*) as total FROM jobseekers').get();

    jobseekers.forEach(js => {
      const skills = db.prepare('SELECT skill FROM jobseeker_skills WHERE jobseeker_id = ?').all(js.id);
      js.skills = skills.map(s => s.skill);
    });

    res.json({ jobseekers, total: countResult.total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ error: '获取求职者列表失败' });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE id = ?').get(req.params.id);
    if (!jobseeker) {
      return res.status(404).json({ error: '求职者不存在' });
    }

    const skills = db.prepare('SELECT skill FROM jobseeker_skills WHERE jobseeker_id = ?').all(req.params.id);
    jobseeker.skills = skills.map(s => s.skill);

    const creditRecords = db.prepare('SELECT * FROM credit_records WHERE jobseeker_id = ? ORDER BY created_at DESC LIMIT 10').all(req.params.id);
    jobseeker.creditRecords = creditRecords;

    res.json({ jobseeker });
  } catch (error) {
    res.status(500).json({ error: '获取求职者详情失败' });
  }
});

module.exports = router;
