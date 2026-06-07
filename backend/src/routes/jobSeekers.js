const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Tesseract = require('tesseract.js');
const db = require('../db');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { logAction } = require('../middleware/audit');
const { calculateMatchScore, saveMatchScore } = require('../services/matchService');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({ storage });

router.get('/profile', authenticateJWT, requireRole('jobseeker'), (req, res) => {
  const profile = db.prepare('SELECT * FROM job_seekers WHERE user_id = ?').get(req.user.id);
  if (!profile) {
    return res.status(404).json({ error: '求职者信息不存在' });
  }

  const certs = db.prepare('SELECT * FROM skill_certificates WHERE job_seeker_id = ?').all(profile.id);
  const resume = db.prepare('SELECT * FROM resumes WHERE job_seeker_id = ?').get(profile.id);

  res.json({
    profile,
    certificates: certs,
    resume: resume ? {
      ...resume,
      skills: resume.skills ? JSON.parse(resume.skills) : [],
      work_experience: resume.work_experience ? JSON.parse(resume.work_experience) : [],
      education_experience: resume.education_experience ? JSON.parse(resume.education_experience) : [],
      project_experience: resume.project_experience ? JSON.parse(resume.project_experience) : [],
      three_d_data: resume.three_d_data ? JSON.parse(resume.three_d_data) : null,
    } : null,
  });
});

router.put('/profile', authenticateJWT, requireRole('jobseeker'), (req, res) => {
  const profile = db.prepare('SELECT * FROM job_seekers WHERE user_id = ?').get(req.user.id);
  if (!profile) {
    return res.status(404).json({ error: '求职者信息不存在' });
  }

  const { name, gender, age, education, work_years, phone, email, expected_salary_min, expected_salary_max, expected_city, self_introduction } = req.body;

  db.prepare(`
    UPDATE job_seekers SET
      name = COALESCE(?, name),
      gender = COALESCE(?, gender),
      age = COALESCE(?, age),
      education = COALESCE(?, education),
      work_years = COALESCE(?, work_years),
      phone = COALESCE(?, phone),
      email = COALESCE(?, email),
      expected_salary_min = COALESCE(?, expected_salary_min),
      expected_salary_max = COALESCE(?, expected_salary_max),
      expected_city = COALESCE(?, expected_city),
      self_introduction = COALESCE(?, self_introduction),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, gender, age, education, work_years, phone, email, expected_salary_min, expected_salary_max, expected_city, self_introduction, profile.id);

  logAction('update_seeker_profile', req, 'job_seeker', profile.id, '更新个人资料');

  res.json({ success: true });
});

router.post('/certificates', authenticateJWT, requireRole('jobseeker'), upload.single('scan_file'), async (req, res) => {
  const profile = db.prepare('SELECT * FROM job_seekers WHERE user_id = ?').get(req.user.id);
  if (!profile) {
    return res.status(404).json({ error: '求职者信息不存在' });
  }

  const { certificate_name, issuing_authority, issue_date, certificate_no } = req.body;
  let ocrData = null;

  if (req.file) {
    try {
      const result = await Tesseract.recognize(req.file.path, 'chi_sim+eng');
      ocrData = result.data.text;
    } catch (e) {
      console.error('OCR error:', e);
    }
  }

  const info = db.prepare(`
    INSERT INTO skill_certificates 
    (job_seeker_id, certificate_name, issuing_authority, issue_date, certificate_no, scan_file, ocr_data)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(profile.id, certificate_name, issuing_authority, issue_date, certificate_no,
         req.file ? req.file.filename : null, ocrData);

  logAction('add_certificate', req, 'skill_certificate', info.lastInsertRowid,
    `添加技能证书：${certificate_name}${ocrData ? '，已完成OCR识别' : ''}`);

  res.json({
    certificateId: info.lastInsertRowid,
    ocrData,
  });
});

router.get('/certificates', authenticateJWT, requireRole('jobseeker'), (req, res) => {
  const profile = db.prepare('SELECT * FROM job_seekers WHERE user_id = ?').get(req.user.id);
  const certs = db.prepare('SELECT * FROM skill_certificates WHERE job_seeker_id = ? ORDER BY created_at DESC').all(profile.id);
  res.json({ certificates: certs });
});

router.delete('/certificates/:id', authenticateJWT, requireRole('jobseeker'), (req, res) => {
  const profile = db.prepare('SELECT * FROM job_seekers WHERE user_id = ?').get(req.user.id);
  const cert = db.prepare('SELECT * FROM skill_certificates WHERE id = ? AND job_seeker_id = ?').get(req.params.id, profile.id);
  
  if (!cert) {
    return res.status(404).json({ error: '证书不存在' });
  }

  if (cert.scan_file) {
    const filePath = path.join(uploadDir, cert.scan_file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  db.prepare('DELETE FROM skill_certificates WHERE id = ?').run(req.params.id);
  logAction('delete_certificate', req, 'skill_certificate', req.params.id, `删除证书：${cert.certificate_name}`);

  res.json({ success: true });
});

router.put('/resume', authenticateJWT, requireRole('jobseeker'), (req, res) => {
  const profile = db.prepare('SELECT * FROM job_seekers WHERE user_id = ?').get(req.user.id);
  if (!profile) {
    return res.status(404).json({ error: '求职者信息不存在' });
  }

  const { resume_title, project_videos, portfolio_url, skills, work_experience, education_experience, project_experience, three_d_data } = req.body;

  const existing = db.prepare('SELECT id FROM resumes WHERE job_seeker_id = ?').get(profile.id);

  if (existing) {
    db.prepare(`
      UPDATE resumes SET
        resume_title = COALESCE(?, resume_title),
        project_videos = COALESCE(?, project_videos),
        portfolio_url = COALESCE(?, portfolio_url),
        skills = ?,
        work_experience = ?,
        education_experience = ?,
        project_experience = ?,
        three_d_data = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE job_seeker_id = ?
    `).run(resume_title, project_videos, portfolio_url,
           JSON.stringify(skills || []),
           JSON.stringify(work_experience || []),
           JSON.stringify(education_experience || []),
           JSON.stringify(project_experience || []),
           three_d_data ? JSON.stringify(three_d_data) : null,
           profile.id);
    
    logAction('update_resume', req, 'resume', existing.id, '更新三维简历');
    res.json({ resumeId: existing.id });
  } else {
    const info = db.prepare(`
      INSERT INTO resumes 
      (job_seeker_id, resume_title, project_videos, portfolio_url, skills, work_experience, education_experience, project_experience, three_d_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(profile.id, resume_title, project_videos, portfolio_url,
           JSON.stringify(skills || []),
           JSON.stringify(work_experience || []),
           JSON.stringify(education_experience || []),
           JSON.stringify(project_experience || []),
           three_d_data ? JSON.stringify(three_d_data) : null);
    
    logAction('create_resume', req, 'resume', info.lastInsertRowid, '创建三维简历');
    res.json({ resumeId: info.lastInsertRowid });
  }
});

router.get('/resume/:id', (req, res) => {
  const resume = db.prepare(`
    SELECT r.*, js.name, js.education, js.work_years, js.phone, js.email, js.self_introduction
    FROM resumes r
    JOIN job_seekers js ON r.job_seeker_id = js.id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!resume) {
    return res.status(404).json({ error: '简历不存在' });
  }

  const certs = db.prepare('SELECT * FROM skill_certificates WHERE job_seeker_id = ?').all(resume.job_seeker_id);

  res.json({
    resume: {
      ...resume,
      skills: resume.skills ? JSON.parse(resume.skills) : [],
      work_experience: resume.work_experience ? JSON.parse(resume.work_experience) : [],
      education_experience: resume.education_experience ? JSON.parse(resume.education_experience) : [],
      project_experience: resume.project_experience ? JSON.parse(resume.project_experience) : [],
      three_d_data: resume.three_d_data ? JSON.parse(resume.three_d_data) : null,
    },
    certificates: certs,
  });
});

router.get('/match-scores', authenticateJWT, requireRole('jobseeker'), (req, res) => {
  const profile = db.prepare('SELECT * FROM job_seekers WHERE user_id = ?').get(req.user.id);
  
  const scores = db.prepare(`
    SELECT ms.*, j.job_title, e.enterprise_name, c.category_name
    FROM job_match_scores ms
    JOIN jobs j ON ms.job_id = j.id
    JOIN enterprises e ON j.enterprise_id = e.id
    JOIN manufacturing_job_categories c ON j.job_category_code = c.category_code
    WHERE ms.job_seeker_id = ?
    ORDER BY ms.created_at DESC
    LIMIT 20
  `).all(profile.id);

  res.json({
    matches: scores.map(s => ({
      ...s,
      dimension_scores: s.dimension_scores ? JSON.parse(s.dimension_scores) : [],
    })),
  });
});

router.get('/match/:jobId', authenticateJWT, requireRole('jobseeker'), (req, res) => {
  const profile = db.prepare('SELECT * FROM job_seekers WHERE user_id = ?').get(req.user.id);
  const resume = db.prepare('SELECT * FROM resumes WHERE job_seeker_id = ?').get(profile.id);
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: '岗位不存在' });
  }

  if (!resume) {
    return res.status(400).json({ error: '请先完善简历' });
  }

  const result = calculateMatchScore(profile, resume, job);
  saveMatchScore(job.id, profile.id, result);

  res.json(result);
});

module.exports = router;
