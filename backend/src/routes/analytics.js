const express = require('express');
const db = require('../db');
const { success, error } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authMiddleware, (req, res) => {
  const { period = '30' } = req.query;
  const days = parseInt(period);
  
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM jobs WHERE company_id = ? AND status = 'published') as published_jobs,
      (SELECT COUNT(*) FROM job_applications ja LEFT JOIN jobs j ON ja.job_id = j.id WHERE j.company_id = ?) as total_applications,
      (SELECT COUNT(*) FROM job_applications ja LEFT JOIN jobs j ON ja.job_id = j.id WHERE j.company_id = ? AND ja.status = 'interview') as interview_count,
      (SELECT COUNT(*) FROM offers o LEFT JOIN jobs j ON o.job_id = j.id WHERE j.company_id = ? AND o.status = 'signed') as hired_count,
      (SELECT COUNT(*) FROM interviews i LEFT JOIN jobs j ON i.job_id = j.id WHERE j.company_id = ? AND DATE(i.schedule_time) >= DATE('now', '-' || ? || ' days')) as recent_interviews
  `).get(req.companyId, req.companyId, req.companyId, req.companyId, req.companyId, days);
  
  const today = new Date().toISOString().split('T')[0];
  const todayInterviews = db.prepare(`
    SELECT COUNT(*) as count FROM interviews i
    LEFT JOIN jobs j ON i.job_id = j.id
    WHERE j.company_id = ? AND DATE(i.schedule_time) = ?
  `).get(req.companyId, today).count;
  
  const channelStats = db.prepare(`
    SELECT 
      COALESCE(c.name, 'direct') as channel_name,
      c.code, c.type,
      COUNT(DISTINCT ja.id) as application_count,
      COUNT(DISTINCT CASE WHEN ja.status = 'interview' THEN ja.id END) as interview_count,
      COUNT(DISTINCT CASE WHEN ja.status = 'hired' THEN ja.id END) as hired_count,
      SUM(CASE WHEN c.type = 'paid' AND c.cost_per_post > 0 THEN c.cost_per_post ELSE 0 END) as total_cost
    FROM job_applications ja
    LEFT JOIN jobs j ON ja.job_id = j.id
    LEFT JOIN channels c ON ja.channel = c.code
    WHERE j.company_id = ?
    GROUP BY ja.channel, c.name, c.code, c.type
    ORDER BY application_count DESC
    LIMIT 10
  `).all(req.companyId);
  
  const channelROI = channelStats.map(c => ({
    ...c,
    conversion_rate: c.application_count > 0 ? Math.round((c.hired_count / c.application_count) * 100) : 0,
    roi: c.total_cost > 0 ? Math.round((c.hired_count * 10000) / c.total_cost) : c.hired_count > 0 ? 999 : 0,
    cost_per_hire: c.hired_count > 0 ? Math.round(c.total_cost / c.hired_count) : 0
  }));
  
  res.json(success({
    stats,
    today_interviews: todayInterviews,
    channel_roi: channelROI
  }));
});

router.get('/funnel', authMiddleware, (req, res) => {
  const { job_id, channel, date_from, date_to } = req.query;
  
  let where = 'WHERE j.company_id = ?';
  const params = [req.companyId];
  
  if (job_id) {
    where += ' AND ja.job_id = ?';
    params.push(job_id);
  }
  if (channel) {
    where += ' AND ja.channel = ?';
    params.push(channel);
  }
  if (date_from) {
    where += ' AND ja.applied_at >= ?';
    params.push(date_from);
  }
  if (date_to) {
    where += ' AND ja.applied_at <= ?';
    params.push(date_to + ' 23:59:59');
  }
  
  const funnel = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN ja.status = 'reviewing' OR ja.status = 'interview' OR ja.status = 'offer' OR ja.status = 'hired' THEN 1 ELSE 0 END) as reviewing,
      SUM(CASE WHEN ja.status = 'interview' OR ja.status = 'offer' OR ja.status = 'hired' THEN 1 ELSE 0 END) as interview,
      SUM(CASE WHEN ja.status = 'offer' OR ja.status = 'hired' THEN 1 ELSE 0 END) as offer,
      SUM(CASE WHEN ja.status = 'hired' THEN 1 ELSE 0 END) as hired
    FROM job_applications ja
    LEFT JOIN jobs j ON ja.job_id = j.id
    ${where}
  `).get(...params);
  
  const steps = [
    { key: 'total', label: '简历投递', count: funnel.total },
    { key: 'reviewing', label: '简历筛选', count: funnel.reviewing },
    { key: 'interview', label: '面试阶段', count: funnel.interview },
    { key: 'offer', label: 'Offer阶段', count: funnel.offer },
    { key: 'hired', label: '成功入职', count: funnel.hired }
  ];
  
  const conversions = [];
  for (let i = 0; i < steps.length - 1; i++) {
    conversions.push({
      from: steps[i].label,
      to: steps[i + 1].label,
      rate: steps[i].count > 0 ? Math.round((steps[i + 1].count / steps[i].count) * 100) : 0
    });
  }
  
  res.json(success({
    funnel: steps,
    conversions,
    overall_rate: funnel.total > 0 ? Math.round((funnel.hired / funnel.total) * 100 * 100) / 100 : 0
  }));
});

router.get('/channel/roi', authMiddleware, (req, res) => {
  const { channel } = req.query;
  
  let where = 'WHERE j.company_id = ?';
  const params = [req.companyId];
  
  if (channel) {
    where += ' AND ja.channel = ?';
    params.push(channel);
  }
  
  const dailyStats = db.prepare(`
    SELECT
      DATE(ja.applied_at) as date,
      ja.channel,
      COUNT(*) as applications,
      SUM(CASE WHEN ja.status = 'interview' THEN 1 ELSE 0 END) as interviews,
      SUM(CASE WHEN ja.status = 'hired' THEN 1 ELSE 0 END) as hires
    FROM job_applications ja
    LEFT JOIN jobs j ON ja.job_id = j.id
    ${where}
    AND ja.applied_at >= DATE('now', '-30 days')
    GROUP BY DATE(ja.applied_at), ja.channel
    ORDER BY date DESC
    LIMIT 30
  `).all(...params);
  
  const channelSummary = db.prepare(`
    SELECT
      ja.channel,
      COALESCE(c.name, 'direct') as channel_name,
      COUNT(*) as total_applications,
      SUM(CASE WHEN ja.status = 'interview' THEN 1 ELSE 0 END) as total_interviews,
      SUM(CASE WHEN ja.status = 'hired' THEN 1 ELSE 0 END) as total_hires,
      AVG(ja.match_score) as avg_match_score
    FROM job_applications ja
    LEFT JOIN jobs j ON ja.job_id = j.id
    LEFT JOIN channels c ON ja.channel = c.code
    WHERE j.company_id = ?
    GROUP BY ja.channel, c.name
    ORDER BY total_hires DESC
  `).all(req.companyId);
  
  res.json(success({
    dailyStats,
    channelSummary
  }));
});

router.get('/jobs/performance', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 20, sort_by = 'apply_count' } = req.query;
  const offset = (page - 1) * pageSize;
  
  const orderMap = {
    apply_count: 'apply_count',
    view_count: 'view_count',
    interview_count: 'interview_count',
    hire_count: 'hire_count',
    hot_score: 'hot_score'
  };
  
  const orderField = orderMap[sort_by] || 'apply_count';
  
  const list = db.prepare(`
    SELECT 
      j.*,
      COUNT(DISTINCT ja.id) as application_count,
      COUNT(DISTINCT CASE WHEN ja.status = 'interview' THEN ja.id END) as interview_count,
      COUNT(DISTINCT CASE WHEN ja.status = 'hired' THEN ja.id END) as hire_count,
      COUNT(DISTINCT i.id) as total_interviews,
      AVG(ja.match_score) as avg_match_score
    FROM jobs j
    LEFT JOIN job_applications ja ON j.id = ja.job_id
    LEFT JOIN interviews i ON j.id = i.job_id
    WHERE j.company_id = ?
    GROUP BY j.id
    ORDER BY ${orderField} DESC
    LIMIT ? OFFSET ?
  `).all(req.companyId, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM jobs WHERE company_id = ?
  `).get(req.companyId).count;
  
  const performance = list.map(j => ({
    ...j,
    interview_rate: j.application_count > 0 ? Math.round((j.interview_count / j.application_count) * 100) : 0,
    hire_rate: j.application_count > 0 ? Math.round((j.hire_count / j.application_count) * 100) : 0,
    avg_time_to_hire: j.total_interviews > 0 ? j.total_interviews * 3 : 0
  }));
  
  res.json(success({
    list: performance,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  }));
});

router.get('/hot/areas', authMiddleware, (req, res) => {
  const { city, date } = req.query;
  const recordDate = date || new Date().toISOString().split('T')[0];
  
  let where = 'WHERE record_date = ?';
  const params = [recordDate];
  
  if (city) {
    where += ' AND city = ?';
    params.push(city);
  }
  
  const areas = db.prepare(`
    SELECT * FROM hot_area_records ${where} ORDER BY hot_score DESC LIMIT 50
  `).all(...params);
  
  const companyAreas = db.prepare(`
    SELECT 
      j.work_city as city,
      j.work_district as district,
      COUNT(*) as job_count,
      SUM(j.hot_score) as total_hot_score,
      AVG(j.salary_min) as avg_salary_min,
      AVG(j.salary_max) as avg_salary_max
    FROM jobs j
    WHERE j.company_id = ? AND j.status = 'published'
    GROUP BY j.work_city, j.work_district
    ORDER BY job_count DESC
    LIMIT 20
  `).all(req.companyId);
  
  res.json(success({
    hot_areas: areas,
    company_areas: companyAreas
  }));
});

router.get('/candidates/source', authMiddleware, (req, res) => {
  const sources = db.prepare(`
    SELECT
      COALESCE(city, '未知') as source,
      COUNT(*) as count,
      AVG(resume_score) as avg_score
    FROM candidates
    GROUP BY city
    ORDER BY count DESC
  `).all();

  const educationStats = db.prepare(`
    SELECT
      COALESCE(highest_education, '未知') as education,
      COUNT(*) as count,
      AVG(resume_score) as avg_score,
      AVG(expected_salary_min) as avg_expected_salary
    FROM candidates
    GROUP BY highest_education
    ORDER BY count DESC
  `).all();

  const experienceStats = db.prepare(`
    SELECT
      CASE
        WHEN work_years < 1 THEN '0-1年'
        WHEN work_years < 3 THEN '1-3年'
        WHEN work_years < 5 THEN '3-5年'
        WHEN work_years < 10 THEN '5-10年'
        ELSE '10年以上'
      END as experience_range,
      COUNT(*) as count,
      AVG(resume_score) as avg_score
    FROM candidates
    GROUP BY experience_range
    ORDER BY MIN(work_years)
  `).all();

  res.json(success({
    sources,
    education_stats: educationStats,
    experience_stats: experienceStats
  }));
});

router.get('/trend', authMiddleware, (req, res) => {
  const { days = 30 } = req.query;
  
  const dailyTrend = db.prepare(`
    WITH RECURSIVE dates(date) AS (
      SELECT DATE('now', '-' || ? || ' days')
      UNION ALL
      SELECT DATE(date, '+1 day') FROM dates WHERE date < DATE('now')
    )
    SELECT
      d.date,
      COALESCE(COUNT(DISTINCT j.id), 0) as new_jobs,
      COALESCE(COUNT(DISTINCT ja.id), 0) as new_applications,
      COALESCE(COUNT(DISTINCT i.id), 0) as new_interviews,
      COALESCE(COUNT(DISTINCT CASE WHEN o.status = 'signed' THEN o.id END), 0) as new_hires
    FROM dates d
    LEFT JOIN jobs j ON DATE(j.created_at) = d.date AND j.company_id = ?
    LEFT JOIN job_applications ja ON DATE(ja.applied_at) = d.date AND ja.job_id IN (SELECT id FROM jobs WHERE company_id = ?)
    LEFT JOIN interviews i ON DATE(i.created_at) = d.date AND i.job_id IN (SELECT id FROM jobs WHERE company_id = ?)
    LEFT JOIN offers o ON DATE(o.signed_at) = d.date AND o.job_id IN (SELECT id FROM jobs WHERE company_id = ?)
    GROUP BY d.date
    ORDER BY d.date DESC
  `).all(days, req.companyId, req.companyId, req.companyId, req.companyId);
  
  res.json(success({
    daily_trend: dailyTrend.reverse(),
    summary: {
      total_jobs: dailyTrend.reduce((sum, d) => sum + d.new_jobs, 0),
      total_applications: dailyTrend.reduce((sum, d) => sum + d.new_applications, 0),
      total_interviews: dailyTrend.reduce((sum, d) => sum + d.new_interviews, 0),
      total_hires: dailyTrend.reduce((sum, d) => sum + d.new_hires, 0)
    }
  }));
});

router.get('/channels', authMiddleware, (req, res) => {
  const channels = db.prepare(`
    SELECT * FROM channels 
    WHERE company_id IS NULL OR company_id = ?
    ORDER BY is_active DESC, type, name
  `).all(req.companyId);
  
  res.json(success(channels));
});

module.exports = router;
