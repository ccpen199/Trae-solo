import { Router } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';

const router = Router();

function parseExperienceRange(exp: string): { min: number; max: number } {
  if (!exp) return { min: 0, max: 99 };
  const match = exp.match(/(\d+)-(\d+)年/);
  if (match) return { min: parseInt(match[1]), max: parseInt(match[2]) };
  const single = exp.match(/(\d+)年以上/);
  if (single) return { min: parseInt(single[1]), max: 99 };
  const fresh = exp.match(/不限|应届生|应届毕业生/);
  if (fresh) return { min: 0, max: 99 };
  return { min: 0, max: 99 };
}

function parseEducationLevel(edu: string): number {
  const levels: Record<string, number> = {
    '不限': 0, '初中': 1, '中专': 2, '高中': 2, '大专': 3, '本科': 4, '硕士': 5, '博士': 6
  };
  return levels[edu] || 0;
}

function calculateMatch(
  jobSkills: string,
  jobExpRequired: string,
  jobEduRequired: string,
  seekerSkills: { skill: string; weight: number }[],
  seekerExpYears: number,
  seekerEducation: string
) {
  let jobSkillsArr: string[] = [];
  try {
    jobSkillsArr = JSON.parse(jobSkills) || [];
  } catch {
    jobSkillsArr = [];
  }

  const seekerSkillNames = seekerSkills.map(s => s.skill.toLowerCase());
  const matchingSkills: string[] = [];
  const gaps: string[] = [];

  jobSkillsArr.forEach(skill => {
    if (seekerSkillNames.includes(skill.toLowerCase())) {
      matchingSkills.push(skill);
    } else {
      gaps.push(skill);
    }
  });

  const skill_match_percent = jobSkillsArr.length > 0
    ? Math.round((matchingSkills.length / jobSkillsArr.length) * 100)
    : 0;

  const expRange = parseExperienceRange(jobExpRequired);
  let experience_match = 0;
  if (seekerExpYears >= expRange.min && seekerExpYears <= expRange.max) {
    experience_match = 100;
  } else if (seekerExpYears > expRange.max) {
    experience_match = 100;
  } else {
    experience_match = Math.max(0, Math.round((seekerExpYears / Math.max(expRange.min, 1)) * 100));
  }

  const jobEduLevel = parseEducationLevel(jobEduRequired);
  const seekerEduLevel = parseEducationLevel(seekerEducation);
  const education_match = seekerEduLevel >= jobEduLevel ? 100 : Math.round((seekerEduLevel / Math.max(jobEduLevel, 1)) * 100);

  const overall_match_score = Math.round(
    skill_match_percent * 0.5 +
    experience_match * 0.3 +
    education_match * 0.2
  );

  const match_reason: string[] = [];
  matchingSkills.slice(0, 3).forEach(skill => {
    match_reason.push(`您的 ${skill} 技能匹配该职位要求`);
  });
  if (experience_match >= 80) {
    match_reason.push(`您的工作经验 (${seekerExpYears}年) 符合职位要求 (${jobExpRequired})`);
  }
  if (education_match >= 100) {
    match_reason.push(`您的学历 (${seekerEducation}) 达到职位要求 (${jobEduRequired})`);
  }

  return {
    skill_match_percent,
    experience_match,
    education_match,
    overall_match_score,
    match_reason,
    gaps,
    matching_skills: matchingSkills
  };
}

router.get('/', (req, res) => {
  const { 
    page = 1, 
    pageSize = 20, 
    keyword, 
    industry, 
    city,
    district,
    street,
    skill,
    salaryMin,
    salaryMax,
    experience,
    education,
    workType,
    sort = 'newest'
  } = req.query;

  let orderBy = 'j.created_at DESC';

  if (sort === 'salary_desc') {
    orderBy = 'j.salary_max DESC';
  } else if (sort === 'salary_asc') {
    orderBy = 'j.salary_min ASC';
  } else if (sort === 'apply_count') {
    orderBy = 'j.apply_count DESC, j.created_at DESC';
  } else if (sort === 'match') {
    orderBy = 'j.created_at DESC';
  }

  let sql = `
    SELECT j.*, c.name as company_name, c.logo as company_logo, c.verified as company_verified,
           c.social_security_verified, j.authenticity_score, j.address_verified,
           c.hiring_count, c.report_count, c.reputation_score
    FROM jobs j 
    JOIN companies c ON j.company_id = c.id 
    WHERE j.status = 'active' AND j.verified = 1
  `;
  const params: any[] = [];

  if (keyword) {
    sql += ' AND (j.title LIKE ? OR j.skills LIKE ? OR j.description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (industry) {
    sql += ' AND j.industry = ?';
    params.push(industry);
  }
  if (city) {
    sql += ' AND j.city = ?';
    params.push(city);
  }
  if (salaryMin) {
    sql += ' AND j.salary_max >= ?';
    params.push(salaryMin);
  }
  if (salaryMax) {
    sql += ' AND j.salary_min <= ?';
    params.push(salaryMax);
  }
  if (experience) {
    sql += ' AND j.experience_required = ?';
    params.push(experience);
  }
  if (education) {
    sql += ' AND j.education_required = ?';
    params.push(education);
  }
  if (district) {
    sql += ' AND j.district = ?';
    params.push(district);
  }
  if (street) {
    sql += ' AND j.street = ?';
    params.push(street);
  }
  if (skill) {
    sql += ' AND j.skills LIKE ?';
    params.push(`%${skill}%`);
  }
  if (workType) {
    sql += ' AND j.work_type = ?';
    params.push(workType);
  }

  const baseSql = sql;
  sql += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  let jobs = db.prepare(sql).all(...params) as any[];

  if (sort === 'match') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, 'recruitment-platform-secret-key-2024') as any;
        const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(decoded.id) as any;
        if (jobseeker) {
          const seekerSkills = db.prepare('SELECT skill, weight FROM skill_weights WHERE jobseeker_id = ?').all(jobseeker.id) as { skill: string; weight: number }[];
          jobs = jobs.map(job => {
            const match = calculateMatch(
              job.skills, job.experience_required, job.education_required,
              seekerSkills, jobseeker.experience_years, jobseeker.education
            );
            return { ...job, match_score: match.overall_match_score };
          }).sort((a, b) => b.match_score - a.match_score);
        }
      } catch {
        // token invalid, ignore match sort
      }
    }
  }

  const whereClause = baseSql.slice(baseSql.indexOf('WHERE'));
  const countSql = `
    SELECT COUNT(*) as count
    FROM jobs j
    JOIN companies c ON j.company_id = c.id
    ${whereClause}
  `;
  const total = db.prepare(countSql).get(...params.slice(0, params.length - 2)) as { count: number };

  jobs = jobs.map(job => ({
    ...job,
    has_reputation_good: (job.reputation_score || 0) >= 80
  }));

  res.json({
    list: jobs,
    total: total.count,
    page: Number(page),
    pageSize: Number(pageSize)
  });
});

router.get('/search/skills', (req, res) => {
  const { keyword } = req.query;

  if (!keyword) {
    return res.json([]);
  }

  const allSkills = db.prepare(`
    SELECT skills FROM jobs WHERE skills IS NOT NULL AND status = 'active'
  `).all() as { skills: string }[];

  const skillCountMap = new Map<string, number>();

  allSkills.forEach(row => {
    try {
      const parsed = JSON.parse(row.skills);
      if (Array.isArray(parsed)) {
        parsed.forEach((s: string) => {
          if (s.toLowerCase().includes(String(keyword).toLowerCase())) {
            skillCountMap.set(s, (skillCountMap.get(s) || 0) + 1);
          }
        });
      }
    } catch {}
  });

  const skills = Array.from(skillCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill]) => skill);

  res.json(skills);
});

router.get('/recommendations', authMiddleware, roleMiddleware('jobseeker'), (req: AuthRequest, res) => {
  const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user!.id) as any;
  
  if (!jobseeker) {
    return res.status(404).json({ error: '求职者信息不存在' });
  }

  const seekerSkills = db.prepare('SELECT skill, weight FROM skill_weights WHERE jobseeker_id = ?').all(jobseeker.id) as { skill: string; weight: number }[];
  
  let is_cold_start = true;
  let recommendedJobs: any[] = [];

  if (seekerSkills.length > 0) {
    is_cold_start = false;
    const activeJobs = db.prepare(`
      SELECT j.*, c.name as company_name, c.logo as company_logo, c.social_security_verified,
             j.authenticity_score, j.address_verified, c.hiring_count, c.report_count, c.reputation_score
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.status = 'active' AND j.verified = 1
      ORDER BY j.apply_count DESC
      LIMIT 50
    `).all() as any[];

    const seekerSkillNames = seekerSkills.map(s => s.skill.toLowerCase());
    
    const jobsWithScore = activeJobs.map(job => {
      const match = calculateMatch(
        job.skills, job.experience_required, job.education_required,
        seekerSkills, jobseeker.experience_years, jobseeker.education
      );
      
      let jobSkillsArr: string[] = [];
      try {
        jobSkillsArr = JSON.parse(job.skills) || [];
      } catch {
        jobSkillsArr = [];
      }
      
      const overlapSkills = jobSkillsArr.filter((s: string) => 
        seekerSkillNames.includes(s.toLowerCase())
      );
      
      let match_reason = `匹配度 ${match.overall_match_score}%`;
      if (overlapSkills.length > 0) {
        match_reason = `您的 ${overlapSkills.slice(0, 2).join('、')} 技能匹配该职位`;
      }

      return {
        ...job,
        match_score: match.overall_match_score,
        match_reason
      };
    });

    recommendedJobs = jobsWithScore
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 10);
  }

  if (is_cold_start || recommendedJobs.length < 5) {
    const popularJobs = db.prepare(`
      SELECT j.*, c.name as company_name, c.logo as company_logo, c.social_security_verified,
             j.authenticity_score, j.address_verified, c.hiring_count, c.report_count, c.reputation_score
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.status = 'active' AND j.verified = 1
      ORDER BY j.apply_count DESC, j.created_at DESC
      LIMIT 10
    `).all() as any[];

    const recentJobs = db.prepare(`
      SELECT j.*, c.name as company_name, c.logo as company_logo, c.social_security_verified,
             j.authenticity_score, j.address_verified, c.hiring_count, c.report_count, c.reputation_score
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.status = 'active' AND j.verified = 1
      ORDER BY j.created_at DESC
      LIMIT 10
    `).all() as any[];

    const combined = [...popularJobs, ...recentJobs];
    const seen = new Set<number>();
    const uniqueJobs = combined.filter(j => {
      if (seen.has(j.id)) return false;
      seen.add(j.id);
      return true;
    });

    const coldStartJobs = uniqueJobs.slice(0, 10).map(job => ({
      ...job,
      match_score: null,
      match_reason: is_cold_start ? '热门推荐' : '补充推荐'
    }));

    if (is_cold_start) {
      recommendedJobs = coldStartJobs;
    } else {
      const existingIds = new Set(recommendedJobs.map(j => j.id));
      const extra = coldStartJobs.filter(j => !existingIds.has(j.id));
      recommendedJobs = [...recommendedJobs, ...extra].slice(0, 10);
    }
  }

  recommendedJobs = recommendedJobs.map(job => ({
    ...job,
    has_reputation_good: (job.reputation_score || 0) >= 80
  }));

  res.json({
    list: recommendedJobs,
    is_cold_start,
    total: recommendedJobs.length
  });
});

router.get('/recommend/matches', authMiddleware, roleMiddleware('jobseeker'), (req: AuthRequest, res) => {
  const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user!.id) as any;
  
  if (!jobseeker) {
    return res.status(404).json({ error: '求职者信息不存在' });
  }

  const matches = db.prepare(`
    SELECT jm.*, j.*, c.name as company_name, c.logo as company_logo
    FROM job_matches jm
    JOIN jobs j ON jm.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    WHERE jm.jobseeker_id = ? AND j.status = 'active'
    ORDER BY jm.match_score DESC
    LIMIT 20
  `).all(jobseeker.id);

  res.json(matches);
});

router.get('/:id/match-explanation', (req: AuthRequest, res) => {
  const job = db.prepare(`
    SELECT j.*, c.name as company_name, c.logo as company_logo
    FROM jobs j
    JOIN companies c ON j.company_id = c.id
    WHERE j.id = ?
  `).get(req.params.id) as any;

  if (!job) {
    return res.status(404).json({ error: '职位不存在' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.json({
      job_id: job.id,
      skill_match_percent: null,
      experience_match: null,
      education_match: null,
      overall_match_score: null,
      match_reason: [],
      gaps: [],
      has_applied: false,
      is_logged_in: false
    });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, 'recruitment-platform-secret-key-2024') as any;
    
    const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(decoded.id) as any;
    if (!jobseeker) {
      return res.status(404).json({ error: '求职者信息不存在' });
    }

    const seekerSkills = db.prepare('SELECT skill, weight FROM skill_weights WHERE jobseeker_id = ?').all(jobseeker.id) as { skill: string; weight: number }[];
    
    const match = calculateMatch(
      job.skills, job.experience_required, job.education_required,
      seekerSkills, jobseeker.experience_years, jobseeker.education
    );

    const applied = db.prepare(
      'SELECT id FROM applications WHERE job_id = ? AND jobseeker_id = ?'
    ).get(job.id, jobseeker.id);

    res.json({
      job_id: job.id,
      skill_match_percent: match.skill_match_percent,
      experience_match: match.experience_match,
      education_match: match.education_match,
      overall_match_score: match.overall_match_score,
      match_reason: match.match_reason,
      gaps: match.gaps,
      has_applied: !!applied,
      is_logged_in: true,
      matching_skills: match.matching_skills
    });
  } catch {
    return res.json({
      job_id: job.id,
      skill_match_percent: null,
      experience_match: null,
      education_match: null,
      overall_match_score: null,
      match_reason: [],
      gaps: [],
      has_applied: false,
      is_logged_in: false
    });
  }
});

router.get('/:id', (req, res) => {
  const job = db.prepare(`
    SELECT j.*, c.name as company_name, c.logo as company_logo, c.verified as company_verified,
           c.social_security_verified, c.description as company_description, c.scale as company_scale, c.industry as company_industry
    FROM jobs j 
    JOIN companies c ON j.company_id = c.id 
    WHERE j.id = ?
  `).get(req.params.id);

  if (!job) {
    return res.status(404).json({ error: '职位不存在' });
  }

  db.prepare('UPDATE jobs SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);

  res.json(job);
});

router.post('/', authMiddleware, roleMiddleware('hr'), (req: AuthRequest, res) => {
  const hr = db.prepare('SELECT * FROM hr_users WHERE user_id = ?').get(req.user!.id) as any;
  
  if (!hr) {
    return res.status(403).json({ error: '不是HR用户' });
  }

  const {
    title, industry, category, description, requirements, skills,
    salary_min, salary_max, salary_negotiable,
    province, city, district, street, address,
    work_type, experience_required, education_required
  } = req.body;

  const result = db.prepare(`
    INSERT INTO jobs (
      company_id, hr_id, title, industry, category, description, requirements, skills,
      salary_min, salary_max, salary_negotiable,
      province, city, district, street, address,
      work_type, experience_required, education_required,
      authenticity_score
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    hr.company_id, hr.id, title, industry, category, description, requirements, skills,
    salary_min, salary_max, salary_negotiable ? 1 : 0,
    province, city, district, street, address,
    work_type, experience_required, education_required,
    75
  );

  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', authMiddleware, roleMiddleware('hr'), (req: AuthRequest, res) => {
  const hr = db.prepare('SELECT * FROM hr_users WHERE user_id = ?').get(req.user!.id) as any;
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id) as any;

  if (!job || job.hr_id !== hr.id) {
    return res.status(403).json({ error: '无权修改此职位' });
  }

  const fields = [
    'title', 'industry', 'category', 'description', 'requirements', 'skills',
    'salary_min', 'salary_max', 'salary_negotiable',
    'province', 'city', 'district', 'street', 'address',
    'work_type', 'experience_required', 'education_required', 'status'
  ];

  const updates: string[] = [];
  const values: any[] = [];

  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(field === 'salary_negotiable' ? (req.body[field] ? 1 : 0) : req.body[field]);
    }
  });

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);
    db.prepare(`UPDATE jobs SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }

  res.json({ success: true });
});

export default router;
