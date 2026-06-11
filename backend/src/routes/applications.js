const express = require('express');
const db = require('../db');
const { success, error, paginate } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');
const { calculateMatch } = require('./candidates');

const router = express.Router();

const STATUS_MAP = {
  pending: '待处理',
  reviewing: '审核中',
  interview: '面试中',
  offer: '已发Offer',
  hired: '已入职',
  rejected: '已拒绝'
};

router.get('/', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 20, status, job_id, keyword, min_match_score, sort_by } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = 'WHERE j.company_id = ?';
  const params = [req.companyId];
  
  if (status && status !== 'all') {
    where += ' AND ja.status = ?';
    params.push(status);
  }
  if (job_id) {
    where += ' AND ja.job_id = ?';
    params.push(job_id);
  }
  if (keyword) {
    where += ' AND (c.name LIKE ? OR c.phone LIKE ? OR j.title LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }
  if (min_match_score) {
    where += ' AND ja.match_score >= ?';
    params.push(parseInt(min_match_score));
  }
  
  let orderBy = 'ja.match_score DESC';
  if (sort_by === 'time') {
    orderBy = 'ja.applied_at DESC';
  } else if (sort_by === 'match') {
    orderBy = 'ja.match_score DESC';
  }
  
  const total = db.prepare(`
    SELECT COUNT(*) as count 
    FROM job_applications ja
    LEFT JOIN jobs j ON ja.job_id = j.id
    LEFT JOIN candidates c ON ja.candidate_id = c.id
    ${where}
  `).get(...params).count;
  
  const list = db.prepare(`
    SELECT ja.*, j.title, j.salary_min, j.salary_max, j.work_city, j.department,
      c.name as candidate_name, c.phone, c.email, c.avatar, c.expected_position,
      c.work_years, c.highest_education, c.skill_tags, c.resume_score
    FROM job_applications ja
    LEFT JOIN jobs j ON ja.job_id = j.id
    LEFT JOIN candidates c ON ja.candidate_id = c.id
    ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  res.json(paginate(list, total, parseInt(page), parseInt(pageSize)));
});

router.get('/:id', authMiddleware, (req, res) => {
  const application = db.prepare(`
    SELECT ja.*, j.*, c.*, 
      hu.name as hr_name, hu.avatar as hr_avatar
    FROM job_applications ja
    LEFT JOIN jobs j ON ja.job_id = j.id
    LEFT JOIN candidates c ON ja.candidate_id = c.id
    LEFT JOIN hr_users hu ON j.hr_id = hu.id
    WHERE ja.id = ? AND j.company_id = ?
  `).get(req.params.id, req.companyId);
  
  if (!application) {
    return res.json(error('投递记录不存在'));
  }
  
  const interviews = db.prepare(`
    SELECT * FROM interviews 
    WHERE application_id = ? 
    ORDER BY schedule_time DESC
  `).all(req.params.id);
  
  const resumes = db.prepare(`
    SELECT * FROM resumes 
    WHERE candidate_id = ? 
    ORDER BY created_at DESC
  `).all(application.candidate_id);
  
  res.json(success({
    application,
    interviews,
    resumes
  }));
});

router.post('/', authMiddleware, (req, res) => {
  const { job_id, candidate_id, resume_id, channel } = req.body;
  
  const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND company_id = ?').get(job_id, req.companyId);
  if (!job) {
    return res.json(error('职位不存在'));
  }
  
  const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(candidate_id);
  if (!candidate) {
    return res.json(error('求职者不存在'));
  }
  
  const match = calculateMatch(candidate, job);
  
  try {
    db.prepare(`
      INSERT INTO job_applications (job_id, candidate_id, resume_id, channel, match_score, skill_match_score, experience_match_score, salary_match_score, intention_score, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(job_id, candidate_id, resume_id, channel || 'direct', match.total, match.skillMatch, match.experienceMatch, match.salaryMatch, match.intentionScore);
    
    db.prepare(`
      UPDATE jobs SET apply_count = apply_count + 1 WHERE id = ?
    `).run(job_id);
    
    res.json(success({ match }, '投递成功'));
  } catch (e) {
    if (e.message.includes('UNIQUE constraint failed')) {
      return res.json(error('该求职者已投递过此职位'));
    }
    throw e;
  }
});

router.put('/:id/status', authMiddleware, (req, res) => {
  const { status, hr_remark } = req.body;
  
  if (!STATUS_MAP[status]) {
    return res.json(error('无效的状态值'));
  }
  
  const application = db.prepare(`
    SELECT ja.* FROM job_applications ja
    LEFT JOIN jobs j ON ja.job_id = j.id
    WHERE ja.id = ? AND j.company_id = ?
  `).get(req.params.id, req.companyId);
  
  if (!application) {
    return res.json(error('投递记录不存在'));
  }
  
  db.prepare(`
    UPDATE job_applications SET status = ?, hr_remark = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(status, hr_remark || application.hr_remark, req.params.id);
  
  res.json(success(null, `状态已更新为：${STATUS_MAP[status]}`));
});

router.post('/:id/note', authMiddleware, (req, res) => {
  const { hr_remark } = req.body;
  
  db.prepare(`
    UPDATE job_applications SET hr_remark = ?, updated_at = datetime('now')
    WHERE id IN (SELECT ja.id FROM job_applications ja LEFT JOIN jobs j ON ja.job_id = j.id WHERE ja.id = ? AND j.company_id = ?)
  `).run(hr_remark, req.params.id, req.companyId);
  
  res.json(success(null, '备注已更新'));
});

router.post('/batch-action', authMiddleware, (req, res) => {
  const { ids, action, status } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.json(error('请选择要操作的记录'));
  }
  
  const placeholders = ids.map(() => '?').join(',');
  const params = [...ids, req.companyId];
  
  if (action === 'update_status' && STATUS_MAP[status]) {
    db.prepare(`
      UPDATE job_applications 
      SET status = ?, updated_at = datetime('now')
      WHERE id IN (${placeholders}) 
      AND job_id IN (SELECT id FROM jobs WHERE company_id = ?)
    `).run(status, ...params);
    
    res.json(success({ updated: ids.length }, `批量更新状态为：${STATUS_MAP[status]}`));
  } else if (action === 'delete') {
    db.prepare(`
      DELETE FROM job_applications 
      WHERE id IN (${placeholders}) 
      AND job_id IN (SELECT id FROM jobs WHERE company_id = ?)
    `).run(...params);
    
    res.json(success({ deleted: ids.length }, '批量删除成功'));
  } else {
    res.json(error('无效的操作'));
  }
});

router.get('/funnel/stats', authMiddleware, (req, res) => {
  const stats = db.prepare(`
    SELECT
      ja.status AS application_status,
      COUNT(ja.id) AS count
    FROM job_applications ja
    LEFT JOIN jobs j ON ja.job_id = j.id
    WHERE j.company_id = ?
    GROUP BY ja.status
    ORDER BY count DESC
  `).all(req.companyId);
  
  const statusOrder = ['pending', 'reviewing', 'interview', 'offer', 'hired', 'rejected'];
  const ordered = statusOrder.map(s => {
    const found = stats.find(s2 => s2.application_status === s);
    return {
      status: s,
      label: STATUS_MAP[s],
      count: found ? found.count : 0
    };
  });
  
  const total = ordered.reduce((sum, s) => sum + s.count, 0);
  
  res.json(success({
    total,
    funnel: ordered,
    conversionRate: total > 0 ? Math.round((ordered.find(s => s.status === 'hired').count / total) * 100) : 0
  }));
});

module.exports = router;
