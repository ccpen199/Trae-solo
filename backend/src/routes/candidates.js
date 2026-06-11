const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { success, error, paginate } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `resume_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const exts = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (exts.includes(ext)) cb(null, true);
    else cb(new Error('仅支持 PDF、Word、TXT 格式'));
  }
});

function parseResume(content) {
  const skills = ['Java', 'Python', 'JavaScript', 'React', 'Vue', 'Node.js', 'SpringBoot', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', '算法', '数据结构', '系统设计', '沟通能力', '团队协作', '领导力', '项目管理', '学习能力', '问题解决', '英语', '日语', 'PMP', 'CPA', '律师资格'];
  
  const foundSkills = skills.filter(skill => 
    content.includes(skill) || content.toLowerCase().includes(skill.toLowerCase())
  );
  
  const workExpMatch = content.match(/(\d+)\s*年.*?经验/);
  const workYears = workExpMatch ? parseInt(workExpMatch[1]) : 0;
  
  const eduMatch = content.match(/(本科|硕士|博士|大专|高中)/);
  const education = eduMatch ? eduMatch[1] : '';
  
  const phoneMatch = content.match(/1[3-9]\d{9}/);
  const phone = phoneMatch ? phoneMatch[0] : '';
  
  const emailMatch = content.match(/[\w.-]+@[\w.-]+\.\w+/);
  const email = emailMatch ? emailMatch[0] : '';
  
  const nameMatch = content.match(/姓\s*名[：:]\s*(\S+)/) || content.match(/^(\S{2,4})\s*$/m);
  const name = nameMatch ? nameMatch[1] : '未知';
  
  const score = Math.min(100, 40 + foundSkills.length * 5 + workYears * 2 + (education === '博士' ? 20 : education === '硕士' ? 15 : education === '本科' ? 10 : 5));
  
  return {
    name,
    phone,
    email,
    workYears,
    education,
    skills: foundSkills,
    score,
    skillGraph: {
      technical: foundSkills.filter(s => ['Java', 'Python', 'JavaScript', 'React', 'Vue', 'Node.js', 'SpringBoot', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', '算法', '数据结构', '系统设计'].includes(s)),
      soft: foundSkills.filter(s => ['沟通能力', '团队协作', '领导力', '项目管理', '学习能力', '问题解决'].includes(s)),
      language: foundSkills.filter(s => ['英语', '日语'].includes(s)),
      certification: foundSkills.filter(s => ['PMP', 'CPA', '律师资格'].includes(s))
    }
  };
}

function predictIntention(candidate, job) {
  let score = 60;
  
  if (candidate.expected_city && job.work_city && candidate.expected_city.includes(job.work_city)) {
    score += 15;
  }
  
  if (candidate.expected_salary_min && job.salary_max) {
    if (candidate.expected_salary_min <= job.salary_max && candidate.expected_salary_max >= job.salary_min) {
      score += 20;
    } else if (candidate.expected_salary_min <= job.salary_max * 1.2) {
      score += 10;
    }
  }
  
  if (candidate.skill_tags && job.competency_tags) {
    const candidateSkills = candidate.skill_tags.split(',');
    const jobSkills = job.competency_tags.split(',');
    const matchCount = candidateSkills.filter(s => jobSkills.some(js => js.includes(s) || s.includes(js))).length;
    score += matchCount * 3;
  }
  
  if (candidate.work_years && job.experience) {
    const expMatch = job.experience.match(/(\d+)/);
    if (expMatch) {
      const required = parseInt(expMatch[1]);
      if (candidate.work_years >= required) {
        score += 10;
      }
    }
  }
  
  return Math.min(100, Math.max(0, score));
}

function calculateMatch(candidate, job) {
  const skillMatch = calculateSkillMatch(candidate.skill_tags, job.competency_tags);
  const expMatch = calculateExperienceMatch(candidate.work_years, job.experience);
  const salaryMatch = calculateSalaryMatch(candidate.expected_salary_min, candidate.expected_salary_max, job.salary_min, job.salary_max);
  const intentionScore = predictIntention(candidate, job);
  
  const total = Math.round(skillMatch * 0.4 + expMatch * 0.2 + salaryMatch * 0.2 + intentionScore * 0.2);
  
  return {
    total,
    skillMatch,
    experienceMatch: expMatch,
    salaryMatch,
    intentionScore
  };
}

function calculateSkillMatch(candidateSkills, jobSkills) {
  if (!candidateSkills || !jobSkills) return 50;
  
  const cSkills = candidateSkills.split(',').map(s => s.trim().toLowerCase());
  const jSkills = jobSkills.split(',').map(s => s.trim().toLowerCase());
  
  if (jSkills.length === 0) return 60;
  
  let matchCount = 0;
  jSkills.forEach(js => {
    if (cSkills.some(cs => cs.includes(js) || js.includes(cs))) {
      matchCount++;
    }
  });
  
  return Math.min(100, Math.round((matchCount / jSkills.length) * 100));
}

function calculateExperienceMatch(candidateExp, jobExp) {
  if (!candidateExp || !jobExp) return 60;
  
  const expMatch = jobExp.match(/(\d+)/);
  if (!expMatch) return 60;
  
  const required = parseInt(expMatch[1]);
  
  if (candidateExp >= required * 2) return 100;
  if (candidateExp >= required) return 85;
  if (candidateExp >= required - 1) return 60;
  return 30;
}

function calculateSalaryMatch(cMin, cMax, jMin, jMax) {
  if (!cMin || !jMin) return 50;
  
  const overlapMin = Math.max(cMin, jMin);
  const overlapMax = Math.min(cMax || cMin * 1.5, jMax || jMin * 1.5);
  
  if (overlapMax >= overlapMin) {
    const overlap = overlapMax - overlapMin;
    const cRange = (cMax || cMin * 1.5) - cMin;
    return Math.min(100, Math.round((overlap / cRange) * 100));
  }
  
  if (cMin <= jMax * 1.2) return 40;
  return 20;
}

router.get('/', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 20, keyword, city, min_score, education } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = 'WHERE 1=1';
  const params = [];
  
  if (keyword) {
    where += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR expected_position LIKE ? OR skill_tags LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw, kw, kw);
  }
  if (city) {
    where += ' AND city = ?';
    params.push(city);
  }
  if (min_score) {
    where += ' AND resume_score >= ?';
    params.push(parseInt(min_score));
  }
  if (education) {
    where += ' AND highest_education = ?';
    params.push(education);
  }
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM candidates ${where}`).get(...params).count;
  
  const list = db.prepare(`
    SELECT * FROM candidates ${where}
    ORDER BY resume_score DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  res.json(paginate(list, total, parseInt(page), parseInt(pageSize)));
});

router.get('/:id', authMiddleware, (req, res) => {
  const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
  if (!candidate) {
    return res.json(error('求职者不存在'));
  }
  
  const resumes = db.prepare('SELECT * FROM resumes WHERE candidate_id = ? ORDER BY created_at DESC').all(req.params.id);
  
  const applications = db.prepare(`
    SELECT ja.*, j.title, j.salary_min, j.salary_max, j.work_city, j.status as job_status
    FROM job_applications ja
    LEFT JOIN jobs j ON ja.job_id = j.id
    WHERE ja.candidate_id = ? AND j.company_id = ?
    ORDER BY ja.applied_at DESC
  `).all(req.params.id, req.companyId);
  
  res.json(success({
    candidate,
    resumes,
    applications
  }));
});

router.post('/upload', authMiddleware, upload.single('resume'), (req, res) => {
  if (!req.file) {
    return res.json(error('请上传简历文件'));
  }
  
  let content = '';
  try {
    if (req.file.mimetype === 'text/plain' || req.file.originalname.endsWith('.txt')) {
      content = fs.readFileSync(req.file.path, 'utf-8');
    } else {
      content = `已上传 ${req.file.originalname}，模拟解析内容。\n技能：Java,SpringBoot,MySQL,Redis,Docker\n工作经验：5年\n学历：本科\n期望薪资：25K-35K\n期望城市：杭州`;
    }
  } catch (e) {
    content = '简历解析中...';
  }
  
  const parsed = parseResume(content);
  
  res.json(success({
    file: {
      originalName: req.file.originalname,
      size: req.file.size,
      path: req.file.filename
    },
    parsed,
    content: content.substring(0, 1000)
  }, '简历解析完成'));
});

router.post('/', authMiddleware, (req, res) => {
  const { name, phone, email, gender, birthday, city, expected_salary_min, expected_salary_max, expected_city, expected_position, work_years, highest_education, current_company, current_position, skill_tags, parsed_content } = req.body;
  
  const resumeScore = parseResume(parsed_content || '').score;
  
  const info = db.prepare(`
    INSERT INTO candidates (name, phone, email, gender, birthday, city, expected_salary_min, expected_salary_max, expected_city, expected_position, work_years, highest_education, current_company, current_position, skill_tags, resume_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, phone, email, gender, birthday, city, expected_salary_min, expected_salary_max, expected_city, expected_position, work_years, highest_education, current_company, current_position, skill_tags, resumeScore);
  
  res.json(success({ id: info.lastInsertRowid, resumeScore }, '求职者创建成功'));
});

router.post('/match/:jobId/:candidateId', authMiddleware, (req, res) => {
  const { jobId, candidateId } = req.params;
  
  const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND company_id = ?').get(jobId, req.companyId);
  if (!job) {
    return res.json(error('职位不存在'));
  }
  
  const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(candidateId);
  if (!candidate) {
    return res.json(error('求职者不存在'));
  }
  
  const match = calculateMatch(candidate, job);
  
  try {
    db.prepare(`
      INSERT OR REPLACE INTO job_applications (job_id, candidate_id, match_score, skill_match_score, experience_match_score, salary_match_score, intention_score, status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT status FROM job_applications WHERE job_id = ? AND candidate_id = ?), 'pending'), datetime('now'))
    `).run(jobId, candidateId, match.total, match.skillMatch, match.experienceMatch, match.salaryMatch, match.intentionScore, jobId, candidateId);
  } catch (e) {
    db.prepare(`
      UPDATE job_applications SET
        match_score = ?, skill_match_score = ?, experience_match_score = ?,
        salary_match_score = ?, intention_score = ?, updated_at = datetime('now')
      WHERE job_id = ? AND candidate_id = ?
    `).run(match.total, match.skillMatch, match.experienceMatch, match.salaryMatch, match.intentionScore, jobId, candidateId);
  }
  
  res.json(success(match, 'AI匹配完成'));
});

router.post('/batch-match/:jobId', authMiddleware, (req, res) => {
  const { jobId } = req.params;
  
  const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND company_id = ?').get(jobId, req.companyId);
  if (!job) {
    return res.json(error('职位不存在'));
  }
  
  const candidates = db.prepare(`
    SELECT c.* 
    FROM candidates c
    INNER JOIN job_applications ja ON c.id = ja.candidate_id
    WHERE ja.job_id = ?
  `).all(jobId);
  
  const results = candidates.map(candidate => {
    const match = calculateMatch(candidate, job);
    
    db.prepare(`
      UPDATE job_applications SET
        match_score = ?, skill_match_score = ?, experience_match_score = ?,
        salary_match_score = ?, intention_score = ?, updated_at = datetime('now')
      WHERE job_id = ? AND candidate_id = ?
    `).run(match.total, match.skillMatch, match.experienceMatch, match.salaryMatch, match.intentionScore, jobId, candidate.id);
    
    return {
      candidateId: candidate.id,
      candidateName: candidate.name,
      ...match
    };
  }).sort((a, b) => b.total - a.total);
  
  res.json(success({
    total: results.length,
    results
  }, '批量匹配完成'));
});

module.exports = { router, calculateMatch };
