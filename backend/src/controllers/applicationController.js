const { db } = require('../models/database');

function calculateMatchScore(jobSkills, resumeSkills) {
  if (!jobSkills || !resumeSkills) return 60;
  
  const jobSkillList = Array.isArray(jobSkills) ? jobSkills : JSON.parse(jobSkills || '[]');
  const resumeSkillList = Array.isArray(resumeSkills) ? resumeSkills : JSON.parse(resumeSkills || '[]');
  
  if (jobSkillList.length === 0) return 70;
  
  const matchedSkills = jobSkillList.filter(skill => 
    resumeSkillList.some(rSkill => 
      rSkill.toLowerCase().includes(skill.toLowerCase()) || 
      skill.toLowerCase().includes(rSkill.toLowerCase())
    )
  );
  
  const matchPercentage = (matchedSkills.length / jobSkillList.length) * 100;
  const baseScore = 50;
  const skillScore = matchPercentage * 0.4;
  const randomBonus = Math.floor(Math.random() * 11);
  
  return Math.min(100, Math.floor(baseScore + skillScore + randomBonus));
}

function getMatchReason(score) {
  if (score >= 85) return '高度匹配！技能与岗位要求高度契合，建议优先面试';
  if (score >= 70) return '匹配度良好。核心技能基本符合岗位需求，值得进一步沟通';
  if (score >= 60) return '基本匹配。部分技能符合要求，可考虑面试了解更多';
  return '匹配度一般。建议查看简历详情后再做决定';
}

function applyJob(req, res) {
  const jobId = req.params.jobId;
  const { resumeId } = req.body;

  const jobseeker = db.prepare('SELECT id FROM jobseekers WHERE user_id = ?').get(req.user.id);
  if (!jobseeker) {
    return res.status(404).json({ error: '求职者信息不存在' });
  }

  const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND is_active = 1').get(jobId);
  if (!job) {
    return res.status(404).json({ error: '岗位不存在或已关闭' });
  }

  const existing = db.prepare('SELECT id FROM applications WHERE job_id = ? AND jobseeker_id = ?').get(jobId, jobseeker.id);
  if (existing) {
    return res.status(400).json({ error: '已投递过该岗位' });
  }

  let resume = null;
  if (resumeId) {
    resume = db.prepare('SELECT * FROM resumes WHERE id = ? AND jobseeker_id = ?').get(resumeId, jobseeker.id);
  }

  const matchScore = calculateMatchScore(job.skills, resume?.skills);
  const matchReason = getMatchReason(matchScore);

  const insertApplication = db.prepare(`
    INSERT INTO applications (job_id, jobseeker_id, resume_id, match_score, match_reason, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `);

  const result = insertApplication.run(jobId, jobseeker.id, resume?.id || null, matchScore, matchReason);

  const application = db.prepare(`
    SELECT a.*, j.title as job_title, c.name as company_name
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    WHERE a.id = ?
  `).get(result.lastInsertRowid);

  res.json({ application });
}

function getMyApplications(req, res) {
  const jobseeker = db.prepare('SELECT id FROM jobseekers WHERE user_id = ?').get(req.user.id);
  if (!jobseeker) {
    return res.status(404).json({ error: '求职者信息不存在' });
  }

  const applications = db.prepare(`
    SELECT a.*, j.title as job_title, j.salary_min, j.salary_max, j.location,
           c.name as company_name, c.logo as company_logo
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    WHERE a.jobseeker_id = ?
    ORDER BY a.created_at DESC
  `).all(jobseeker.id);

  res.json({ applications });
}

function getJobApplications(req, res) {
  const jobId = req.params.jobId;

  const company = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(req.user.id);
  if (!company) {
    return res.status(404).json({ error: '企业信息不存在' });
  }

  const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND company_id = ?').get(jobId, company.id);
  if (!job) {
    return res.status(404).json({ error: '岗位不存在或无权限查看' });
  }

  const applications = db.prepare(`
    SELECT a.*, j.name as jobseeker_name, j.education, j.experience,
           r.skills as resume_skills, r.video_id as resume_video_id
    FROM applications a
    JOIN jobseekers j ON a.jobseeker_id = j.id
    LEFT JOIN resumes r ON a.resume_id = r.id
    WHERE a.job_id = ?
    ORDER BY a.match_score DESC, a.created_at DESC
  `).all(jobId);

  applications.forEach(app => {
    app.resume_skills = app.resume_skills ? JSON.parse(app.resume_skills) : [];
  });

  res.json({ applications });
}

function updateApplicationStatus(req, res) {
  const applicationId = req.params.id;
  const { status } = req.body;

  const validStatuses = ['pending', 'viewed', 'interview', 'offer', 'rejected', 'hired'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: '无效的状态' });
  }

  const company = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(req.user.id);
  if (!company) {
    return res.status(404).json({ error: '企业信息不存在' });
  }

  const application = db.prepare(`
    SELECT a.* FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE a.id = ? AND j.company_id = ?
  `).get(applicationId, company.id);

  if (!application) {
    return res.status(404).json({ error: '投递记录不存在或无权限修改' });
  }

  db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, applicationId);

  const updatedApplication = db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId);
  res.json({ application: updatedApplication });
}

function getFunnelStats(req, res) {
  const company = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(req.user.id);
  if (!company) {
    return res.status(404).json({ error: '企业信息不存在' });
  }

  const jobs = db.prepare('SELECT id FROM jobs WHERE company_id = ?').all(company.id);
  const jobIds = jobs.map(j => j.id).join(',') || '0';

  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'viewed' THEN 1 ELSE 0 END) as viewed,
      SUM(CASE WHEN status = 'interview' THEN 1 ELSE 0 END) as interview,
      SUM(CASE WHEN status = 'offer' THEN 1 ELSE 0 END) as offer,
      SUM(CASE WHEN status = 'hired' THEN 1 ELSE 0 END) as hired,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
    FROM applications 
    WHERE job_id IN (${jobIds})
  `).get();

  const totalViews = db.prepare(`
    SELECT SUM(views_count) as total_views 
    FROM jobs 
    WHERE company_id = ?
  `).get(company.id);

  res.json({
    funnel: {
      exposure: totalViews.total_views || 0,
      viewed: stats.viewed || 0,
      applications: stats.total || 0,
      interviews: stats.interview || 0,
      hires: stats.hired || 0
    },
    details: stats
  });
}

module.exports = { applyJob, getMyApplications, getJobApplications, updateApplicationStatus, getFunnelStats };
