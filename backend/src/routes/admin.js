const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('./auth');

const router = express.Router();

router.get('/stats', authMiddleware, (req, res) => {
  try {
    const totalWorkers = db.prepare('SELECT COUNT(*) as count FROM workers').get().count;
    const totalCompanies = db.prepare('SELECT COUNT(*) as count FROM companies').get().count;
    const totalTeams = db.prepare('SELECT COUNT(*) as count FROM teams').get().count;
    const totalJobs = db.prepare('SELECT COUNT(*) as count FROM job_posts').get().count;
    const openJobs = db.prepare("SELECT COUNT(*) as count FROM job_posts WHERE status = 'open'").get().count;
    const totalMatches = db.prepare('SELECT COUNT(*) as count FROM job_matches').get().count;
    const todayAttendances = db.prepare("SELECT COUNT(*) as count FROM attendances WHERE DATE(created_at) = DATE('now')").get().count;

    const skillStats = db.prepare(`
      SELECT skill_required as skill, COUNT(*) as count
      FROM job_posts
      WHERE status = 'open'
      GROUP BY skill_required
      ORDER BY count DESC
      LIMIT 10
    `).all();

    const regionStats = db.prepare(`
      SELECT location, COUNT(*) as count, AVG(daily_salary) as avg_salary
      FROM job_posts
      WHERE status = 'open'
      GROUP BY location
      ORDER BY count DESC
      LIMIT 10
    `).all();

    res.json({
      overview: {
        totalWorkers,
        totalCompanies,
        totalTeams,
        totalJobs,
        openJobs,
        totalMatches,
        todayAttendances
      },
      skillStats,
      regionStats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

router.get('/safety/tips', (req, res) => {
  try {
    const tips = db.prepare('SELECT * FROM safety_knowledge ORDER BY created_at DESC').all();
    res.json(tips);
  } catch (error) {
    res.status(500).json({ error: '获取安全知识失败' });
  }
});

router.get('/safety/daily-tip', (req, res) => {
  try {
    const tip = db.prepare('SELECT * FROM safety_knowledge WHERE is_daily_tip = 1 ORDER BY RANDOM() LIMIT 1').get();
    res.json(tip || { title: '安全第一', content: '施工时请务必佩戴安全帽' });
  } catch (error) {
    res.status(500).json({ error: '获取每日安全提示失败' });
  }
});

router.get('/contracts/templates', (req, res) => {
  try {
    const templates = db.prepare('SELECT * FROM contract_templates').all();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: '获取合同模板失败' });
  }
});

router.get('/disputes', authMiddleware, (req, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: '只有管理员可以查看' });
  }

  try {
    const disputes = db.prepare(`
      SELECT ld.*, jp.title as job_title
      FROM labor_disputes ld
      JOIN job_matches jm ON ld.job_match_id = jm.id
      JOIN job_posts jp ON jm.job_id = jp.id
      ORDER BY ld.created_at DESC
    `).all();
    res.json(disputes);
  } catch (error) {
    res.status(500).json({ error: '获取纠纷列表失败' });
  }
});

router.get('/workers', authMiddleware, (req, res) => {
  try {
    const workers = db.prepare(`
      SELECT w.*, u.name, u.phone, u.real_name_verified
      FROM workers w
      JOIN users u ON w.user_id = u.id
      LIMIT 50
    `).all();
    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: '获取工友列表失败' });
  }
});

router.get('/companies', authMiddleware, (req, res) => {
  try {
    const companies = db.prepare(`
      SELECT c.*, u.name, u.phone
      FROM companies c
      JOIN users u ON c.user_id = u.id
      LIMIT 50
    `).all();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: '获取企业列表失败' });
  }
});

module.exports = router;
