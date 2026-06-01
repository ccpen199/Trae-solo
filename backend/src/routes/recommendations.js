const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function getSemanticClusters(jobs, history) {
  const keywords = new Set();
  history.forEach(h => {
    if (h.title) {
      h.title.split(/[\s,，。！？、]+/).forEach(word => {
        if (word.length >= 2) keywords.add(word.toLowerCase());
      });
    }
  });

  const clusters = {};
  jobs.forEach(job => {
    let score = 0;
    const text = `${job.title} ${job.description || ''}`.toLowerCase();
    keywords.forEach(kw => {
      if (text.includes(kw)) score += 1;
    });
    job.semantic_score = score;
  });

  return jobs;
}

router.get('/jobs', authenticateToken, (req, res) => {
  const jobseeker = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user.id);
  if (!jobseeker) {
    return res.status(404).json({ error: 'Jobseeker profile not found' });
  }

  const { radius = 3, limit = 20 } = req.query;
  const userLat = jobseeker.location_lat;
  const userLng = jobseeker.location_lng;

  let jobs = db.prepare(`
    SELECT j.*, c.name as company_name, c.industry, c.scale,
           j.location_lat as lat, j.location_lng as lng
    FROM jobs j
    JOIN companies c ON j.company_id = c.id
    WHERE j.is_active = 1 AND c.verification_status = 'verified'
  `).all();

  const lbsJobs = [];
  const otherJobs = [];

  jobs.forEach(job => {
    if (userLat && userLng && job.lat && job.lng) {
      const distance = haversineDistance(userLat, userLng, job.lat, job.lng);
      job.distance = Math.round(distance * 100) / 100;
      if (distance <= radius) {
        lbsJobs.push(job);
      } else {
        otherJobs.push(job);
      }
    } else {
      otherJobs.push(job);
    }
  });

  lbsJobs.sort((a, b) => a.distance - b.distance);

  const history = db.prepare(`
    SELECT j.title, j.description FROM browse_history bh
    JOIN jobs j ON bh.job_id = j.id
    WHERE bh.user_id = ?
    ORDER BY bh.created_at DESC
    LIMIT 50
  `).all(req.user.id);

  const allJobs = [...lbsJobs, ...otherJobs];
  const scoredJobs = getSemanticClusters(allJobs, history);

  scoredJobs.forEach(job => {
    if (job.requirements) job.requirements = JSON.parse(job.requirements);
    job.lbs_score = job.distance ? (1 / (job.distance + 1)) * 100 : 0;
    job.total_score = job.lbs_score + (job.semantic_score || 0) * 10;
  });

  scoredJobs.sort((a, b) => b.total_score - a.total_score);

  const result = scoredJobs.slice(0, limit);

  res.json({
    recommendations: result,
    lbs_count: lbsJobs.length,
    total_count: jobs.length
  });
});

router.get('/resumes', authenticateToken, (req, res) => {
  const company = db.prepare('SELECT * FROM companies WHERE user_id = ?').get(req.user.id);
  if (!company) {
    return res.status(404).json({ error: 'Company profile not found' });
  }

  const { limit = 20 } = req.query;

  const companyJobs = db.prepare('SELECT title, description FROM jobs WHERE company_id = ?').get(company.id);
  
  let resumes = db.prepare(`
    SELECT r.*, j.real_name, j.city, j.work_years, j.education,
           j.location_lat, j.location_lng
    FROM resumes r
    JOIN jobseekers j ON r.jobseeker_id = j.id
    WHERE r.is_active = 1
  `).all();

  const jobKeywords = new Set();
  if (companyJobs) {
    `${companyJobs.title} ${companyJobs.description}`.split(/[\s,，。！？、]+/)
      .forEach(word => word.length >= 2 && jobKeywords.add(word.toLowerCase()));
  }

  resumes.forEach(resume => {
    let score = 0;
    const text = `${resume.title} ${resume.self_intro || ''} ${resume.skills || ''}`.toLowerCase();
    jobKeywords.forEach(kw => {
      if (text.includes(kw)) score += 1;
    });
    if (resume.skills) resume.skills = JSON.parse(resume.skills);
    resume.match_score = score * 10;
  });

  resumes.sort((a, b) => b.match_score - a.match_score);

  res.json({
    recommendations: resumes.slice(0, limit)
  });
});

router.get('/explore', (req, res) => {
  const { type = 'jobs', limit = 10 } = req.query;

  if (type === 'jobs') {
    const jobs = db.prepare(`
      SELECT j.*, c.name as company_name, c.industry
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.is_active = 1 AND c.verification_status = 'verified'
      ORDER BY j.view_count DESC
      LIMIT ?
    `).all(parseInt(limit));

    jobs.forEach(j => {
      if (j.requirements) j.requirements = JSON.parse(j.requirements);
    });

    res.json({ items: jobs });
  } else {
    const resumes = db.prepare(`
      SELECT r.*, j.real_name, j.city, j.work_years
      FROM resumes r
      JOIN jobseekers j ON r.jobseeker_id = j.id
      WHERE r.is_active = 1
      ORDER BY r.view_count DESC
      LIMIT ?
    `).all(parseInt(limit));

    resumes.forEach(r => {
      if (r.skills) r.skills = JSON.parse(r.skills);
    });

    res.json({ items: resumes });
  }
});

module.exports = router;
