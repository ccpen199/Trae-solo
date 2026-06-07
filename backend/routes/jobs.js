
const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { checkRateLimit, logAudit } = require('../middleware/rateLimit');

const router = express.Router();

const VALID_BENEFITS = ['五险一金', '包住', '通勤班车', '年终奖', '节日福利', '带薪年假', '员工体检', '团建活动'];

router.get('/', authenticateToken, (req, res) => {
  try {
    const { keyword, location, position_level, min_salary } = req.query;
    
    let sql = `
      SELECT 
        j.*,
        c.name as company_name, c.verified as company_verified, c.address as company_address,
        u.username as posted_by_name
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      JOIN users u ON j.posted_by = u.id
      WHERE j.status = 'active'
    `;
    const params = [];

    if (keyword) {
      sql += ' AND (j.title LIKE ? OR j.description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (location) {
      sql += ' AND j.location LIKE ?';
      params.push(`%${location}%`);
    }
    if (position_level) {
      sql += ' AND j.position_level = ?';
      params.push(position_level);
    }
    if (min_salary) {
      sql += ' AND j.salary_max >= ?';
      params.push(min_salary);
    }

    sql += ' ORDER BY j.created_at DESC';

    const jobs = db.prepare(sql).all(...params);

    const jobsWithBenefits = jobs.map(job => {
      const benefits = db.prepare(`
        SELECT benefit_type, benefit_value FROM job_benefits WHERE job_id = ?
      `).all(job.id);
      return { ...job, benefits };
    });

    res.json({ jobs: jobsWithBenefits });
  } catch (err) {
    console.error('获取职位列表失败:', err);
    res.status(500).json({ error: '获取职位列表失败' });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    
    const job = db.prepare(`
      SELECT 
        j.*,
        c.name as company_name, c.verified as company_verified, c.license_number, c.address as company_address,
        c.latitude, c.longitude, c.description as company_description,
        u.username as posted_by_name
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      JOIN users u ON j.posted_by = u.id
      WHERE j.id = ?
    `).get(id);

    if (!job) {
      return res.status(404).json({ error: '职位不存在' });
    }

    const benefits = db.prepare(`
      SELECT benefit_type, benefit_value FROM job_benefits WHERE job_id = ?
    `).all(id);

    const photos = db.prepare(`
      SELECT * FROM company_photos WHERE company_id = ?
    `).all(job.company_id);

    const rewards = db.prepare(`
      SELECT * FROM referral_rewards WHERE company_id = ? AND position_level = ?
    `).all(job.company_id, job.position_level);

    res.json({ job: { ...job, benefits }, photos, rewards });
  } catch (err) {
    console.error('获取职位详情失败:', err);
    res.status(500).json({ error: '获取职位详情失败' });
  }
});

router.post('/',
  authenticateToken,
  requireRole('employer', 'admin'),
  checkRateLimit('post_job', 10, 60),
  logAudit('post_job'),
  (req, res) => {
    try {
      const { 
        company_id, title, description, salary_min, salary_max, 
        location, position_level, benefits, requirements 
      } = req.body;

      const userCompanyId = req.user.current_company_id;
      const finalCompanyId = req.user.role === 'admin' ? company_id : userCompanyId;

      if (!finalCompanyId) {
        return res.status(400).json({ error: '请先创建或加入公司' });
      }

      const company = db.prepare('SELECT * FROM companies WHERE id = ? AND verified = 1').get(finalCompanyId);
      if (!company) {
        return res.status(400).json({ error: '公司未通过认证，请先完成营业执照认证' });
      }

      if (!title || !description || !salary_min || !salary_max || !location || !position_level) {
        return res.status(400).json({ error: '请填写完整的职位信息' });
      }

      if (salary_min >= salary_max) {
        return res.status(400).json({ error: '最低薪资必须小于最高薪资' });
      }

      const tx = db.transaction(() => {
        const jobResult = db.prepare(`
          INSERT INTO jobs (company_id, title, description, salary_min, salary_max, location, position_level, requirements, posted_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(finalCompanyId, title, description, salary_min, salary_max, location, position_level, requirements || null, req.user.id);

        const jobId = jobResult.lastInsertRowid;

        if (benefits && Array.isArray(benefits)) {
          const insertBenefit = db.prepare(`
            INSERT INTO job_benefits (job_id, benefit_type, benefit_value)
            VALUES (?, ?, ?)
          `);

          benefits.forEach(benefit => {
            if (VALID_BENEFITS.includes(benefit.type)) {
              insertBenefit.run(jobId, benefit.type, benefit.value || null);
            }
          });
        }

        return jobId;
      });

      const jobId = tx();

      const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
      const jobBenefits = db.prepare('SELECT benefit_type, benefit_value FROM job_benefits WHERE job_id = ?').all(jobId);

      res.json({ job: { ...job, benefits: jobBenefits } });
    } catch (err) {
      console.error('发布职位失败:', err);
      res.status(500).json({ error: '发布职位失败' });
    }
  }
);

router.get('/benefits/types', (req, res) => {
  res.json({ benefit_types: VALID_BENEFITS });
});

module.exports = router;
