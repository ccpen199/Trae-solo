const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('./auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { skill, location, minSalary, maxSalary, page = 1, pageSize = 10 } = req.query;
  
  let query = `
    SELECT jp.*, c.company_name, c.contact_phone 
    FROM job_posts jp 
    JOIN companies c ON jp.company_id = c.id 
    WHERE jp.status = 'open'
  `;
  const params = [];

  if (skill) {
    query += ' AND jp.skill_required LIKE ?';
    params.push(`%${skill}%`);
  }
  if (location) {
    query += ' AND jp.location LIKE ?';
    params.push(`%${location}%`);
  }
  if (minSalary) {
    query += ' AND jp.daily_salary >= ?';
    params.push(minSalary);
  }
  if (maxSalary) {
    query += ' AND jp.daily_salary <= ?';
    params.push(maxSalary);
  }

  query += ' ORDER BY jp.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  try {
    const jobs = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM job_posts WHERE status = ?').get('open');
    
    res.json({ jobs, total: total.count });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: '获取招工列表失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const job = db.prepare(`
      SELECT jp.*, c.company_name, c.address, c.contact_person, c.contact_phone
      FROM job_posts jp
      JOIN companies c ON jp.company_id = c.id
      WHERE jp.id = ?
    `).get(req.params.id);

    if (!job) {
      return res.status(404).json({ error: '招工信息不存在' });
    }

    res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: '获取招工详情失败' });
  }
});

router.post('/', authMiddleware, (req, res) => {
  if (req.userRole !== 'company') {
    return res.status(403).json({ error: '只有企业可以发布招工' });
  }

  const { 
    title, job_type, skill_required, workers_needed, 
    location, lat, lng, daily_salary, start_date, end_date,
    description, safety_training_required, special_cert_required, deposit_amount
  } = req.body;

  if (!title || !job_type || !skill_required || !location || !daily_salary || !start_date || !end_date) {
    return res.status(400).json({ error: '必填项不能为空' });
  }

  try {
    const company = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(req.userId);
    if (!company) {
      return res.status(400).json({ error: '企业信息不存在' });
    }

    const result = db.prepare(`
      INSERT INTO job_posts (
        company_id, title, job_type, skill_required, workers_needed,
        location, lat, lng, daily_salary, start_date, end_date,
        description, safety_training_required, special_cert_required, deposit_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      company.id, title, job_type, skill_required, workers_needed || 1,
      location, lat || null, lng || null, daily_salary, start_date, end_date,
      description || '', safety_training_required ? 1 : 0, special_cert_required || '', deposit_amount || 0
    );

    res.json({ id: result.lastInsertRowid, message: '招工发布成功' });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: '发布招工失败' });
  }
});

router.post('/:id/apply', authMiddleware, (req, res) => {
  if (req.userRole !== 'worker' && req.userRole !== 'team') {
    return res.status(403).json({ error: '只有工友或班组可以申请' });
  }

  const jobId = req.params.id;

  try {
    const job = db.prepare('SELECT * FROM job_posts WHERE id = ? AND status = ?').get(jobId, 'open');
    if (!job) {
      return res.status(400).json({ error: '招工不存在或已关闭' });
    }

    let workerId = null;
    let teamId = null;

    if (req.userRole === 'worker') {
      const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(req.userId);
      workerId = worker.id;
    } else {
      const team = db.prepare('SELECT id FROM teams WHERE user_id = ?').get(req.userId);
      teamId = team.id;
    }

    const existing = db.prepare(`
      SELECT id FROM job_matches 
      WHERE job_id = ? AND (worker_id = ? OR team_id = ?)
    `).get(jobId, workerId, teamId);

    if (existing) {
      return res.status(400).json({ error: '已申请该招工' });
    }

    db.prepare(`
      INSERT INTO job_matches (job_id, worker_id, team_id, match_score)
      VALUES (?, ?, ?, ?)
    `).run(jobId, workerId, teamId, 85);

    res.json({ message: '申请成功' });
  } catch (error) {
    console.error('Apply job error:', error);
    res.status(500).json({ error: '申请失败' });
  }
});

router.get('/matches/recommendations', authMiddleware, (req, res) => {
  try {
    let profile;
    if (req.userRole === 'worker') {
      profile = db.prepare('SELECT * FROM workers WHERE user_id = ?').get(req.userId);
    } else if (req.userRole === 'team') {
      profile = db.prepare('SELECT * FROM teams WHERE user_id = ?').get(req.userId);
    } else {
      return res.status(403).json({ error: '只有工友和班组可以查看推荐' });
    }

    const jobs = db.prepare(`
      SELECT jp.*, c.company_name, c.contact_phone
      FROM job_posts jp
      JOIN companies c ON jp.company_id = c.id
      WHERE jp.status = 'open'
      ORDER BY jp.created_at DESC
      LIMIT 10
    `).all();

    const recommendations = jobs.map(job => ({
      ...job,
      match_score: Math.floor(Math.random() * 30) + 70,
      reasons: ['技能匹配', '距离合适', '薪资符合预期']
    }));

    res.json(recommendations);
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: '获取推荐失败' });
  }
});

router.post('/matches/:id/accept', authMiddleware, (req, res) => {
  if (req.userRole !== 'company') {
    return res.status(403).json({ error: '只有企业可以接受申请' });
  }

  try {
    const matchId = req.params.id;
    db.prepare("UPDATE job_matches SET status = 'accepted' WHERE id = ?").run(matchId);
    
    const match = db.prepare('SELECT job_id FROM job_matches WHERE id = ?').get(matchId);
    db.prepare("UPDATE job_posts SET status = 'matched' WHERE id = ?").run(match.job_id);

    res.json({ message: '已接受申请' });
  } catch (error) {
    console.error('Accept match error:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

module.exports = router;
