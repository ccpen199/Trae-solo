const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('./auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, phone, name, role, real_name_verified FROM users WHERE id = ?').get(req.userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    let profile = {};
    if (user.role === 'worker') {
      profile = db.prepare('SELECT * FROM workers WHERE user_id = ?').get(req.userId);
    } else if (user.role === 'company') {
      profile = db.prepare('SELECT * FROM companies WHERE user_id = ?').get(req.userId);
    } else if (user.role === 'team') {
      profile = db.prepare('SELECT * FROM teams WHERE user_id = ?').get(req.userId);
    }

    res.json({ ...user, profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

router.put('/worker', authMiddleware, (req, res) => {
  if (req.userRole !== 'worker') {
    return res.status(403).json({ error: '只有工友可以更新' });
  }

  const { skills, experience_years, experience_tags, certificates, 
          location, lat, lng, daily_salary_expected, available_start_date, available_end_date } = req.body;

  try {
    db.prepare(`
      UPDATE workers 
      SET skills = ?, experience_years = ?, experience_tags = ?, certificates = ?,
          location = ?, lat = ?, lng = ?, daily_salary_expected = ?, 
          available_start_date = ?, available_end_date = ?
      WHERE user_id = ?
    `).run(
      skills || '', experience_years || 0, experience_tags || '', certificates || '',
      location || '', lat || null, lng || null, daily_salary_expected || 0,
      available_start_date || null, available_end_date || null,
      req.userId
    );

    res.json({ message: '更新成功' });
  } catch (error) {
    console.error('Update worker error:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

router.put('/company', authMiddleware, (req, res) => {
  if (req.userRole !== 'company') {
    return res.status(403).json({ error: '只有企业可以更新' });
  }

  const { company_name, license_number, address, contact_person, contact_phone, safety_certificates } = req.body;

  try {
    db.prepare(`
      UPDATE companies 
      SET company_name = ?, license_number = ?, address = ?, 
          contact_person = ?, contact_phone = ?, safety_certificates = ?
      WHERE user_id = ?
    `).run(
      company_name || '', license_number || '', address || '',
      contact_person || '', contact_phone || '', safety_certificates || '',
      req.userId
    );

    res.json({ message: '更新成功' });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

router.get('/my-jobs', authMiddleware, (req, res) => {
  try {
    if (req.userRole === 'company') {
      const company = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(req.userId);
      if (!company) return res.json([]);
      const jobs = db.prepare(`
        SELECT * FROM job_posts 
        WHERE company_id = ? 
        ORDER BY created_at DESC
      `).all(company.id);
      res.json(jobs);
    } else if (req.userRole === 'worker') {
      const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(req.userId);
      if (!worker) return res.json([]);
      const matches = db.prepare(`
        SELECT jm.*, jp.*, c.company_name
        FROM job_matches jm
        JOIN job_posts jp ON jm.job_id = jp.id
        JOIN companies c ON jp.company_id = c.id
        WHERE jm.worker_id = ?
        ORDER BY jm.created_at DESC
      `).all(worker.id);
      res.json(matches);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({ error: '获取我的招工失败' });
  }
});

module.exports = router;
