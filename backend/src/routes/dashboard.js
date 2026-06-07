const express = require('express');
const db = require('../db');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/job-supply-demand', authenticateJWT, (req, res) => {
  const { category } = req.query;

  let sql = `
    SELECT 
      c.category_code,
      c.category_name,
      COUNT(DISTINCT j.id) as job_count,
      COUNT(DISTINCT a.id) as application_count,
      CASE WHEN COUNT(DISTINCT j.id) > 0 
           THEN ROUND(COUNT(DISTINCT a.id) * 1.0 / COUNT(DISTINCT j.id), 2)
           ELSE 0 END as supply_demand_ratio
    FROM manufacturing_job_categories c
    LEFT JOIN jobs j ON c.category_code = j.job_category_code AND j.status = 'active'
    LEFT JOIN applications a ON j.id = a.job_id
    WHERE c.level = 2
  `;
  const params = [];

  if (category) {
    sql += ' AND c.parent_code = ?';
    params.push(category);
  }

  sql += ' GROUP BY c.category_code, c.category_name ORDER BY job_count DESC';

  const data = db.prepare(sql).all(...params);

  res.json({ data });
});

router.get('/average-onboarding-cycle', authenticateJWT, (req, res) => {
  const data = db.prepare(`
    SELECT 
      c.category_code,
      c.category_name,
      COUNT(*) as hire_count,
      ROUND(AVG(JULIANDAY(ob.onboard_date) - JULIANDAY(a.applied_at)), 1) as avg_days
    FROM onboarding_records ob
    JOIN applications a ON ob.application_id = a.id
    JOIN jobs j ON a.job_id = j.id
    JOIN manufacturing_job_categories c ON j.job_category_code = c.category_code
    WHERE ob.onboard_date IS NOT NULL
    GROUP BY c.category_code, c.category_name
    ORDER BY avg_days ASC
  `).all();

  const overall = db.prepare(`
    SELECT 
      COUNT(*) as total_hires,
      ROUND(AVG(JULIANDAY(ob.onboard_date) - JULIANDAY(a.applied_at)), 1) as overall_avg_days
    FROM onboarding_records ob
    JOIN applications a ON ob.application_id = a.id
    WHERE ob.onboard_date IS NOT NULL
  `).get();

  res.json({ data, overall });
});

router.get('/talent-retention', authenticateJWT, (req, res) => {
  const data = db.prepare(`
    SELECT 
      c.category_code,
      c.category_name,
      COUNT(*) as total_hires,
      SUM(CASE WHEN ob.is_still_employed = 1 THEN 1 ELSE 0 END) as retained_count,
      ROUND(SUM(CASE WHEN ob.is_still_employed = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as retention_rate,
      ROUND(AVG(CASE WHEN ob.is_still_employed = 0 
                THEN JULIANDAY(COALESCE(ob.resignation_date, DATE('now'))) - JULIANDAY(ob.onboard_date)
                ELSE JULIANDAY(DATE('now')) - JULIANDAY(ob.onboard_date)
           END), 1) as avg_tenure_days
    FROM onboarding_records ob
    JOIN applications a ON ob.application_id = a.id
    JOIN jobs j ON a.job_id = j.id
    JOIN manufacturing_job_categories c ON j.job_category_code = c.category_code
    GROUP BY c.category_code, c.category_name
    ORDER BY retention_rate DESC
  `).all();

  const overall = db.prepare(`
    SELECT 
      COUNT(*) as total_hires,
      SUM(CASE WHEN is_still_employed = 1 THEN 1 ELSE 0 END) as retained_count,
      ROUND(SUM(CASE WHEN is_still_employed = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as overall_retention_rate
    FROM onboarding_records
  `).get();

  res.json({ data, overall });
});

router.get('/salary-trends', authenticateJWT, (req, res) => {
  const { city = '上海' } = req.query;

  const data = db.prepare(`
    SELECT 
      c.category_name,
      ROUND(AVG(j.salary_min)) as avg_min_salary,
      ROUND(AVG(j.salary_max)) as avg_max_salary,
      ROUND(AVG((j.salary_min + j.salary_max) / 2)) as avg_mid_salary,
      sr.salary_min as ref_min,
      sr.salary_max as ref_max,
      COUNT(j.id) as job_count
    FROM jobs j
    JOIN manufacturing_job_categories c ON j.job_category_code = c.category_code
    LEFT JOIN salary_references sr ON j.job_category_code = sr.job_category_code 
           AND j.city = sr.city AND j.work_experience_required = sr.work_years
    WHERE j.city = ? AND j.status = 'active' AND c.level = 2
    GROUP BY c.category_code, c.category_name, sr.salary_min, sr.salary_max
    ORDER BY avg_mid_salary DESC
  `).all(city);

  res.json({ data, city });
});

router.get('/application-funnel', authenticateJWT, requireRole('hr', 'admin'), (req, res) => {
  const enterprise = db.prepare('SELECT * FROM enterprises WHERE user_id = ?').get(req.user.id);

  let sql = `
    SELECT 
      a.status,
      COUNT(*) as count
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role !== 'admin' && enterprise) {
    sql += ' AND j.enterprise_id = ?';
    params.push(enterprise.id);
  }

  sql += ' GROUP BY a.status ORDER BY count DESC';

  const data = db.prepare(sql).all(...params);

  const statusOrder = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
  const funnel = statusOrder.map(s => {
    const item = data.find(d => d.status === s);
    return {
      status: s,
      count: item?.count || 0,
      label: {
        applied: '已投递',
        screening: '初筛中',
        interview: '面试中',
        offer: '已发Offer',
        hired: '已入职',
        rejected: '已拒绝'
      }[s] || s
    };
  });

  res.json({ funnel });
});

router.get('/overview', authenticateJWT, (req, res) => {
  const totalJobs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'active'").get().count;
  const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
  const totalHires = db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'hired'").get().count;
  const totalEnterprises = db.prepare("SELECT COUNT(*) as count FROM enterprises WHERE qualification_status = 'approved'").get().count;

  const recentApplications = db.prepare(`
    SELECT a.*, j.job_title, js.name, e.enterprise_name, c.category_name
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN job_seekers js ON a.job_seeker_id = js.id
    JOIN enterprises e ON j.enterprise_id = e.id
    JOIN manufacturing_job_categories c ON j.job_category_code = c.category_code
    ORDER BY a.applied_at DESC
    LIMIT 10
  `).all();

  const hotJobs = db.prepare(`
    SELECT j.*, e.enterprise_name, c.category_name,
           COUNT(a.id) as application_count
    FROM jobs j
    JOIN enterprises e ON j.enterprise_id = e.id
    JOIN manufacturing_job_categories c ON j.job_category_code = c.category_code
    LEFT JOIN applications a ON j.id = a.job_id
    WHERE j.status = 'active'
    GROUP BY j.id
    ORDER BY application_count DESC
    LIMIT 8
  `).all();

  res.json({
    summary: {
      totalJobs,
      totalApplications,
      totalHires,
      totalEnterprises,
    },
    recentApplications,
    hotJobs: hotJobs.map(j => ({
      ...j,
      ability_model: j.ability_model ? JSON.parse(j.ability_model) : null,
    })),
  });
});

module.exports = router;
