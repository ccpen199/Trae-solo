const express = require('express');
const { db } = require('../models/db');
const { authMiddleware } = require('./auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { industry, page = 1, pageSize = 10 } = req.query;

  let sql = 'SELECT * FROM companies WHERE 1=1';
  const params = [];

  if (industry) {
    sql += ' AND industry = ?';
    params.push(industry);
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
  const total = db.prepare(countSql).get(...params).count;

  sql += ' ORDER BY credit_score DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const companies = db.prepare(sql).all(...params);
  res.json({ companies, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', (req, res) => {
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
  if (!company) {
    return res.status(404).json({ error: '企业不存在' });
  }

  const jobs = db.prepare('SELECT * FROM jobs WHERE company_id = ? AND status = ? ORDER BY created_at DESC')
    .all(req.params.id, 'active');

  const reviews = db.prepare(`
    SELECT r.*, js.name as seeker_name
    FROM reviews r
    LEFT JOIN job_seekers js ON r.seeker_id = js.id
    WHERE r.company_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.id);

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  res.json({ ...company, jobs, reviews, avgRating });
});

router.get('/:id/credit', (req, res) => {
  const company = db.prepare(`
    SELECT id, name, turnover_rate, social_insurance_rate, credit_score,
           (SELECT COUNT(*) FROM reviews WHERE company_id = ?) as review_count
    FROM companies WHERE id = ?
  `).get(req.params.id, req.params.id);

  if (!company) {
    return res.status(404).json({ error: '企业不存在' });
  }

  res.json({
    ...company,
    turnover_rate_display: `${(company.turnover_rate * 100).toFixed(1)}%`,
    social_insurance_rate_display: `${(company.social_insurance_rate * 100).toFixed(1)}%`,
    credit_level: company.credit_score >= 4.5 ? 'A级' : company.credit_score >= 3.5 ? 'B级' : company.credit_score >= 2.5 ? 'C级' : 'D级'
  });
});

router.post('/review', authMiddleware, (req, res) => {
  if (req.user.role !== 'seeker') {
    return res.status(403).json({ error: '只有求职者可以评价' });
  }

  const { company_id, job_id, rating, comment, is_employee } = req.body;

  if (!company_id || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: '请提供有效的评分' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO reviews (company_id, seeker_id, job_id, rating, comment, is_employee)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(company_id, req.user.seeker_id, job_id || null, rating, comment || '', is_employee ? 1 : 0);

    const avgRating = db.prepare(`
      SELECT AVG(rating) as avg, COUNT(*) as count
      FROM reviews WHERE company_id = ?
    `).get(company_id);

    db.prepare(`
      UPDATE job_seekers 
      SET rating = ((rating * review_count) + ?) / (review_count + 1),
          review_count = review_count + 1
      WHERE id = ?
    `).run(rating, req.user.seeker_id);

    db.prepare(`
      UPDATE companies 
      SET credit_score = ?
      WHERE id = ?
    `).run(avgRating.avg, company_id);

    res.json({ id: result.lastInsertRowid, new_company_rating: avgRating.avg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
