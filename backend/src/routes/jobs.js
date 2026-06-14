const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { calculateMatchScore } = require('../utils/matching');

const router = express.Router();

function enrichJobForReview(job, query = {}) {
  const selectedSkills = Array.isArray(query.skills)
    ? query.skills
    : (query.skills ? [query.skills] : []);

  let skillMatch = 50;
  if (selectedSkills.length > 0) {
    const jobSkillsLower = (job.skills || []).map(s => s.toLowerCase());
    const matchedCount = selectedSkills.filter(s =>
      jobSkillsLower.some(js => js.includes(s.toLowerCase()) || s.toLowerCase().includes(js))
    ).length;
    skillMatch = Math.round((matchedCount / selectedSkills.length) * 100);
    if (skillMatch === 0) skillMatch = 20;
  }

  let salaryMatch = 60;
  if (query.salaryMin || query.salaryMax) {
    const qMin = Number(query.salaryMin) || 0;
    const qMax = Number(query.salaryMax) || 99999;
    const jMin = job.salary_min || 0;
    const jMax = job.salary_max || 0;
    if (jMax >= qMin && jMin <= qMax) {
      const overlap = Math.min(jMax, qMax) - Math.max(jMin, qMin);
      const range = (qMax - qMin) || 1;
      salaryMatch = Math.round(Math.min(1, overlap / range) * 100);
    } else if (jMax < qMin) {
      salaryMatch = Math.round((jMax / qMin) * 40);
    } else {
      salaryMatch = 65;
    }
  }

  let locationMatch = 50;
  if (query.location) {
    locationMatch = String(job.location || '').includes(query.location) ? 95 : 35;
  } else if (job.location) {
    locationMatch = 60;
  }

  let availableDateMatch = 70;
  if (query.availableDate) {
    if (job.available_date) {
      const diffDays = Math.ceil((new Date(job.available_date) - new Date(query.availableDate)) / 86400000);
      if (diffDays <= 0) availableDateMatch = 100;
      else if (diffDays <= 7) availableDateMatch = 85;
      else if (diffDays <= 30) availableDateMatch = 60;
      else availableDateMatch = 35;
    } else {
      availableDateMatch = 75;
    }
  }

  const companyMatch = Math.round(((job.company_rating || 4.6) / 5) * 100);

  const commuteRadius = Number(query.commuteRadius) || 0;
  let commuteText = '未设置通勤半径';
  if (commuteRadius > 0) {
    commuteText = `${commuteRadius}公里内优先推荐`;
  } else if (job.location) {
    commuteText = '可根据求职者定位计算通勤距离';
  }

  const matchScore = job.matchScore || Math.round(
    skillMatch * 0.35 + salaryMatch * 0.25 + locationMatch * 0.20 + companyMatch * 0.15 + availableDateMatch * 0.05
  );

  const riskReview = job.is_verified
    ? '低风险·已认证企业'
    : '⚠️ 企业未认证·投递前请确认资质';

  const isVerified = job.is_verified ? 1 : 0;

  return {
    ...job,
    matchScore,
    skillMatch,
    salaryMatch,
    locationMatch,
    availableDateMatch,
    companyMatch,
    matchBreakdown: `技能${skillMatch}%×35% + 薪资${salaryMatch}%×25% + 地点${locationMatch}%×20% + 企业${companyMatch}%×15% + 到岗${availableDateMatch}%×5%`,
    hard_requirements: job.requirements || '需完成实名认证、技能证书或过往履约记录复核',
    commute_radius_km: commuteRadius || 30,
    commute_estimate: commuteText,
    employer_audit_status: isVerified ? '企业资质已认证' : '企业资质待复核·高风险拦截中',
    employer_verified: isVerified,
    hr_response_sla: job.hr_response_time || '24小时内响应',
    onboarding_flow: ['投递简历', '在线沟通', '面试确认', '签约到岗'],
    risk_review: riskReview,
    risk_level: isVerified ? 'low' : 'high',
    recruiting_effect: `${job.view_count || 0}次浏览 / ${job.apply_count || 0}次投递`,
    exposure_rate: job.view_count > 0 ? Math.round((job.apply_count / job.view_count) * 100) : 0
  };
}

router.get('/', (req, res) => {
  const { 
    page = 1, limit = 20, keyword, location, salaryMin, salaryMax, 
    skills, workType, availableDate, commuteRadius, sortBy = 'match' 
  } = req.query;
  
  const offset = (page - 1) * limit;

  let query = `
    SELECT j.*, e.company_name, e.rating as company_rating, e.is_verified, e.hr_response_time
    FROM jobs j
    LEFT JOIN employers e ON j.employer_id = e.id
    WHERE j.status = 'active'
  `;
  const params = [];

  if (keyword) {
    query += ` AND (
      j.title LIKE ? OR j.description LIKE ? OR j.location LIKE ? OR j.work_type LIKE ?
      OR j.requirements LIKE ? OR j.benefits LIKE ? OR e.company_name LIKE ?
      OR EXISTS (SELECT 1 FROM job_skills js WHERE js.job_id = j.id AND js.skill LIKE ?)
    )`;
    params.push(
      `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`,
      `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`
    );
  }
  if (location) {
    query += ' AND j.location LIKE ?';
    params.push(`%${location}%`);
  }
  if (salaryMin) {
    query += ' AND j.salary_max >= ?';
    params.push(salaryMin);
  }
  if (salaryMax) {
    query += ' AND j.salary_min <= ?';
    params.push(salaryMax);
  }
  if (skills && skills.length > 0) {
    const skillList = Array.isArray(skills) ? skills : [skills];
    const skillConditions = skillList.map(() => 
      'EXISTS (SELECT 1 FROM job_skills js WHERE js.job_id = j.id AND js.skill LIKE ?)'
    ).join(' OR ');
    query += ` AND (${skillConditions})`;
    skillList.forEach(s => params.push(`%${s}%`));
  }
  if (workType) {
    query += ' AND j.work_type = ?';
    params.push(workType);
  }
  if (availableDate) {
    query += ' AND (j.available_date <= ? OR j.available_date IS NULL)';
    params.push(availableDate);
  }

  let jobs = db.prepare(query).all(...params);
  
  if (jobs.length === 0 && (keyword || location || salaryMin || salaryMax || skills)) {
    jobs = db.prepare(`
      SELECT j.*, e.company_name, e.rating as company_rating, e.is_verified, e.hr_response_time
      FROM jobs j
      LEFT JOIN employers e ON j.employer_id = e.id
      WHERE j.status = 'active'
      ORDER BY j.view_count DESC, j.created_at DESC
      LIMIT ?
    `).all(parseInt(limit));
    jobs.forEach(job => {
      job.match_fallback = 1;
      job.match_reason = '未命中精确条件，已展示可投递岗位用于复核匹配条件';
    });
  }

  const getSkills = db.prepare('SELECT skill FROM job_skills WHERE job_id = ?');
  jobs.forEach(job => {
    const skillRows = getSkills.all(job.id);
    job.skills = skillRows.map(s => s.skill);
  });

  if (sortBy === 'match' && req.user && req.user.role === 'jobseeker') {
    const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user.id);
    if (jobseeker) {
      const jsSkills = db.prepare('SELECT skill FROM jobseeker_skills WHERE jobseeker_id = ?').all(jobseeker.id);
      jobseeker.skills = jsSkills.map(s => s.skill);
      
      jobs = jobs.map(job => {
        const jobSkills = getSkills.all(job.id);
        const matchResult = calculateMatchScore(jobseeker, job, jobSkills, {
          requireWithinRadius: commuteRadius ? true : false
        });
        return { ...job, ...matchResult };
      });
      
      jobs.sort((a, b) => b.matchScore - a.matchScore);
    }
  } else if (sortBy === 'match') {
    jobs = jobs.map(job => enrichJobForReview(job, req.query));
    jobs.sort((a, b) => b.matchScore - a.matchScore);
  } else if (sortBy === 'salary') {
    jobs.sort((a, b) => b.salary_max - a.salary_min);
  } else if (sortBy === 'newest') {
    jobs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else if (sortBy === 'rating') {
    jobs.sort((a, b) => (b.company_rating || 0) - (a.company_rating || 0));
  }

  const total = jobs.length;
  const paginatedJobs = jobs
    .map(job => enrichJobForReview(job, req.query))
    .slice(offset, offset + parseInt(limit));

  res.json({ 
    jobs: paginatedJobs, 
    total, 
    page: parseInt(page), 
    limit: parseInt(limit),
    sortBy
  });
});

router.get('/:id', (req, res) => {
  try {
    const job = db.prepare(`
      SELECT j.*, e.company_name, e.company_description, e.contact_person, e.contact_phone, 
             e.rating as company_rating, e.is_verified, e.hr_response_time, e.response_rate, e.avg_response_time
      FROM jobs j
      LEFT JOIN employers e ON j.employer_id = e.id
      WHERE j.id = ?
    `).get(req.params.id);

    if (!job) {
      return res.status(404).json({ error: '岗位不存在' });
    }

    db.prepare('UPDATE jobs SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);

    const skills = db.prepare('SELECT skill FROM job_skills WHERE job_id = ?').all(req.params.id);
    job.skills = skills.map(s => s.skill);

    if (req.user && req.user.role === 'jobseeker') {
      const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user.id);
      if (jobseeker) {
        const jsSkills = db.prepare('SELECT skill FROM jobseeker_skills WHERE jobseeker_id = ?').all(jobseeker.id);
        jobseeker.skills = jsSkills.map(s => s.skill);
        const { calculateMatchScore } = require('../utils/matching');
        const matchResult = calculateMatchScore(jobseeker, job, skills);
        Object.assign(job, matchResult);
      }
    }

    res.json({ job: enrichJobForReview(job, req.query) });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: '获取岗位详情失败' });
  }
});

router.post('/', authenticateToken, requireRole(['employer']), (req, res) => {
  const { 
    title, description, salaryMin, salaryMax, location, workType, 
    requirements, benefits, hasFood, hasLodging, hasInsurance, hasFund, 
    availableDate, isUrgent, latitude, longitude, skills = [] 
  } = req.body;

  try {
    const employer = db.prepare('SELECT * FROM employers WHERE user_id = ?').get(req.user.id);
    if (!employer) {
      return res.status(404).json({ error: '企业信息不存在' });
    }

    const insertJob = db.prepare(`
      INSERT INTO jobs (employer_id, title, description, salary_min, salary_max, location, work_type, 
                        requirements, benefits, has_food, has_lodging, has_insurance, has_fund,
                        available_date, is_urgent, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = insertJob.run(
      employer.id, title, description, salaryMin, salaryMax, location || '', workType || '', 
      requirements || '', benefits || '', hasFood ? 1 : 0, hasLodging ? 1 : 0, hasInsurance ? 1 : 0, hasFund ? 1 : 0,
      availableDate || null, isUrgent ? 1 : 0, latitude || null, longitude || null
    );

    const insertSkill = db.prepare('INSERT INTO job_skills (job_id, skill) VALUES (?, ?)');
    skills.forEach(skill => {
      if (skill.trim()) {
        insertSkill.run(result.lastInsertRowid, skill.trim());
      }
    });

    res.json({ jobId: result.lastInsertRowid, message: '岗位发布成功' });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: '发布岗位失败' });
  }
});

router.put('/:id', authenticateToken, requireRole(['employer']), (req, res) => {
  const { title, description, salaryMin, salaryMax, location, workType, requirements, benefits, hasFood, hasLodging, hasInsurance, hasFund, status } = req.body;

  try {
    const employer = db.prepare('SELECT * FROM employers WHERE user_id = ?').get(req.user.id);
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);

    if (!job) {
      return res.status(404).json({ error: '岗位不存在' });
    }
    if (job.employer_id !== employer.id) {
      return res.status(403).json({ error: '无权修改此岗位' });
    }

    db.prepare(`
      UPDATE jobs 
      SET title = ?, description = ?, salary_min = ?, salary_max = ?, location = ?, work_type = ?, requirements = ?, benefits = ?, has_food = ?, has_lodging = ?, has_insurance = ?, has_fund = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, salaryMin, salaryMax, location || '', workType || '', requirements || '', benefits || '', hasFood ? 1 : 0, hasLodging ? 1 : 0, hasInsurance ? 1 : 0, hasFund ? 1 : 0, status || 'active', req.params.id);

    res.json({ message: '岗位更新成功' });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: '更新岗位失败' });
  }
});

router.get('/employer/my', authenticateToken, requireRole(['employer']), (req, res) => {
  try {
    const employer = db.prepare('SELECT * FROM employers WHERE user_id = ?').get(req.user.id);
    const jobs = db.prepare('SELECT * FROM jobs WHERE employer_id = ? ORDER BY created_at DESC').all(employer.id);
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ error: '获取我的岗位失败' });
  }
});

module.exports = router;
