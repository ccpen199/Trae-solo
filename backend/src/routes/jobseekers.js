const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware');

const router = express.Router();

function parseJSONField(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch (e) {
    return value;
  }
}

router.get('/profile', authenticateToken, requireRole(['jobseeker']), (req, res) => {
  const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user.id);
  if (!jobseeker) {
    return res.status(404).json({ error: '未找到求职者信息' });
  }

  res.json({
    ...jobseeker,
    skills: parseJSONField(jobseeker.skills),
    languages: parseJSONField(jobseeker.languages),
    ftz_preferences: parseJSONField(jobseeker.ftz_preferences)
  });
});

router.put('/profile', authenticateToken, requireRole(['jobseeker']), (req, res) => {
  const {
    resume, skills, languages, experience_years, education,
    ftz_preferences, expected_salary_min, expected_salary_max
  } = req.body;

  const existing = db.prepare('SELECT id FROM jobseekers WHERE user_id = ?').get(req.user.id);
  
  if (!existing) {
    db.prepare('INSERT INTO jobseekers (user_id) VALUES (?)').run(req.user.id);
  }

  db.prepare(`
    UPDATE jobseekers SET
      resume = COALESCE(?, resume),
      skills = COALESCE(?, skills),
      languages = COALESCE(?, languages),
      experience_years = COALESCE(?, experience_years),
      education = COALESCE(?, education),
      ftz_preferences = COALESCE(?, ftz_preferences),
      expected_salary_min = COALESCE(?, expected_salary_min),
      expected_salary_max = COALESCE(?, expected_salary_max)
    WHERE user_id = ?
  `).run(
    resume || null,
    skills ? JSON.stringify(skills) : null,
    languages ? JSON.stringify(languages) : null,
    experience_years || null,
    education || null,
    ftz_preferences ? JSON.stringify(ftz_preferences) : null,
    expected_salary_min || null,
    expected_salary_max || null,
    req.user.id
  );

  res.json({ message: '个人资料已更新' });
});

router.get('/applications', authenticateToken, requireRole(['jobseeker']), (req, res) => {
  const jobseeker = db.prepare('SELECT id FROM jobseekers WHERE user_id = ?').get(req.user.id);
  if (!jobseeker) {
    return res.status(404).json({ error: '未找到求职者信息' });
  }

  const applications = db.prepare(`
    SELECT a.*, j.title_cn, j.title_en, j.company_id, c.company_name, j.salary_min, j.salary_max, j.location
    FROM applications a
    LEFT JOIN jobs j ON a.job_id = j.id
    LEFT JOIN companies c ON j.company_id = c.id
    WHERE a.jobseeker_id = ?
    ORDER BY a.created_at DESC
  `).all(jobseeker.id);

  res.json(applications);
});

router.get('/recommended-jobs', authenticateToken, requireRole(['jobseeker']), (req, res) => {
  const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user.id);
  if (!jobseeker) {
    return res.status(404).json({ error: '未找到求职者信息' });
  }

  const skills = parseJSONField(jobseeker.skills) || [];
  const languages = parseJSONField(jobseeker.languages) || [];
  const ftzPrefs = parseJSONField(jobseeker.ftz_preferences) || {};

  let sql = `
    SELECT j.*, c.company_name, c.is_encouraged_industry, ic.name_cn as category_name
    FROM jobs j
    LEFT JOIN companies c ON j.company_id = c.id
    LEFT JOIN industry_catalog ic ON j.category = ic.code
    WHERE j.is_active = 1 AND j.is_approved = 1
  `;
  const params = [];

  if (ftzPrefs.tax_benefit || ftzPrefs.housing_subsidy) {
    sql += ' AND j.has_ftz_subsidy = 1';
  }

  if (jobseeker.expected_salary_min) {
    sql += ' AND j.salary_max >= ?';
    params.push(jobseeker.expected_salary_min);
  }

  if (jobseeker.expected_salary_max) {
    sql += ' AND j.salary_min <= ?';
    params.push(jobseeker.expected_salary_max);
  }

  sql += ' ORDER BY j.created_at DESC LIMIT 20';
  
  const jobs = db.prepare(sql).all(...params);

  const scoredJobs = jobs.map(job => {
    let score = 0;
    let matchReasons = [];

    const jobTags = parseJSONField(job.tags) || [];
    const jobRcepSkills = parseJSONField(job.rcep_skills) || [];

    for (const skill of skills) {
      if (jobTags.includes(skill) || job.description_cn.includes(skill)) {
        score += 10;
        matchReasons.push(`技能匹配：${skill}`);
      }
    }

    for (const lang of languages) {
      if (jobRcepSkills.includes(lang) || job.description_cn.includes(lang)) {
        score += 15;
        matchReasons.push(`语言匹配：${lang}`);
      }
    }

    if (job.has_ftz_subsidy && (ftzPrefs.tax_benefit || ftzPrefs.housing_subsidy)) {
      score += 20;
      matchReasons.push('符合您的自贸岗偏好');
    }

    if (job.is_encouraged_industry) {
      score += 5;
      matchReasons.push('鼓励类产业企业');
    }

    return {
      ...job,
      tags: jobTags,
      rcep_skills: jobRcepSkills,
      has_ftz_subsidy: !!job.has_ftz_subsidy,
      is_encouraged_industry: !!job.is_encouraged_industry,
      matchScore: score,
      matchReasons
    };
  });

  scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

  res.json({
    jobs: scoredJobs.slice(0, 10),
    preferences: ftzPrefs,
    skills,
    languages
  });
});

module.exports = router;
