const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { calculateMatchScore } = require('../utils/matching');

const router = express.Router();

router.get('/jobs/recommended', authenticateToken, requireRole(['jobseeker']), (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user.id);
    
    if (!jobseeker) {
      return res.json({ jobs: [], total: 0 });
    }

    const jobs = db.prepare(`
      SELECT j.*, e.company_name, e.rating as company_rating, e.is_verified
      FROM jobs j
      LEFT JOIN employers e ON j.employer_id = e.id
      WHERE j.status = 'active'
      ORDER BY j.created_at DESC
      LIMIT 100
    `).all();

    const jobsWithScores = jobs.map(job => {
      const jobSkills = db.prepare('SELECT skill FROM job_skills WHERE job_id = ?').all(job.id);
      const scoreResult = calculateMatchScore(jobseeker, job, jobSkills);
      return { 
        ...job, 
        skills: jobSkills.map(s => s.skill),
        ...scoreResult 
      };
    });

    jobsWithScores.sort((a, b) => b.matchScore - a.matchScore);

    const paginatedJobs = jobsWithScores.slice(offset, offset + parseInt(limit));

    res.json({ 
      jobs: paginatedJobs, 
      total: jobsWithScores.length, 
      page: parseInt(page), 
      limit: parseInt(limit) 
    });
  } catch (error) {
    console.error('Get recommended jobs error:', error);
    res.status(500).json({ error: '获取推荐岗位失败' });
  }
});

router.get('/jobseekers/recommended/:jobId', authenticateToken, requireRole(['employer']), (req, res) => {
  const { jobId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const job = db.prepare(`
      SELECT j.*, e.rating as company_rating
      FROM jobs j
      LEFT JOIN employers e ON j.employer_id = e.id
      WHERE j.id = ?
    `).get(jobId);

    if (!job) {
      return res.status(404).json({ error: '岗位不存在' });
    }

    const jobSkills = db.prepare('SELECT skill FROM job_skills WHERE job_id = ?').all(jobId);

    const jobseekers = db.prepare('SELECT * FROM jobseekers').all();

    const jobseekersWithScores = jobseekers.map(js => {
      const scoreResult = calculateMatchScore(js, job, jobSkills);
      return { ...js, ...scoreResult };
    });

    jobseekersWithScores.sort((a, b) => b.matchScore - a.matchScore);

    const paginatedJobseekers = jobseekersWithScores.slice(offset, offset + parseInt(limit));

    paginatedJobseekers.forEach(js => {
      const skills = db.prepare('SELECT skill FROM jobseeker_skills WHERE jobseeker_id = ?').all(js.id);
      js.skills = skills.map(s => s.skill);
    });

    res.json({ 
      jobseekers: paginatedJobseekers, 
      total: jobseekersWithScores.length, 
      page: parseInt(page), 
      limit: parseInt(limit) 
    });
  } catch (error) {
    console.error('Get recommended jobseekers error:', error);
    res.status(500).json({ error: '获取推荐求职者失败' });
  }
});

router.post('/match/score', authenticateToken, (req, res) => {
  const { jobseekerId, jobId } = req.body;

  try {
    const job = db.prepare(`
      SELECT j.*, e.rating as company_rating
      FROM jobs j
      LEFT JOIN employers e ON j.employer_id = e.id
      WHERE j.id = ?
    `).get(jobId);

    const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE id = ?').get(jobseekerId);

    if (!job || !jobseeker) {
      return res.status(404).json({ error: '岗位或求职者不存在' });
    }

    const jobSkills = db.prepare('SELECT skill FROM job_skills WHERE job_id = ?').all(jobId);
    const score = calculateMatchScore(jobseeker, job, jobSkills);

    res.json({ score });
  } catch (error) {
    res.status(500).json({ error: '计算匹配度失败' });
  }
});

module.exports = router;
