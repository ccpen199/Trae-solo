const express = require('express');
const { db } = require('../models/db');
const { authMiddleware } = require('./auth');

const router = express.Router();

router.use(authMiddleware);

router.use((req, res, next) => {
  if (req.user && req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
});

function getStats(req, res) {
  const totalCompanies = db.prepare('SELECT COUNT(*) as count FROM companies').get().count;
  const totalSeekers = db.prepare('SELECT COUNT(*) as count FROM job_seekers').get().count;
  const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get().count;
  const activeJobs = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE status = ?').get('active').count;
  const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
  const totalInterviews = db.prepare('SELECT COUNT(*) as count FROM interviews').get().count;
  const suspiciousJobs = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE is_suspicious = 1').get().count;
  const negativeOpinions = db.prepare('SELECT COUNT(*) as count FROM public_opinions WHERE sentiment = ?').get('negative').count;

  res.json({
    totalCompanies,
    totalSeekers,
    totalJobs,
    activeJobs,
    totalApplications,
    totalInterviews,
    suspiciousJobs,
    negativeOpinions
  });
}

router.get('/stats', getStats);
router.get('/dashboard', getStats);

router.get('/opinions', (req, res) => {
  const { sentiment, source, page = 1, pageSize = 20 } = req.query;

  let sql = `
    SELECT po.*, c.name as company_name
    FROM public_opinions po
    LEFT JOIN companies c ON po.company_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (sentiment) {
    sql += ' AND po.sentiment = ?';
    params.push(sentiment);
  }
  if (source) {
    sql += ' AND po.source = ?';
    params.push(source);
  }

  const countSql = sql.replace('SELECT po.*, c.name as company_name', 'SELECT COUNT(*) as count');
  const total = db.prepare(countSql).get(...params).count;

  sql += ' ORDER BY po.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const opinions = db.prepare(sql).all(...params);

  res.json({ opinions, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/opinions/keywords', (req, res) => {
  const keywords = db.prepare(`
    SELECT keyword, COUNT(*) as count, sentiment
    FROM public_opinions
    GROUP BY keyword, sentiment
    ORDER BY count DESC
    LIMIT 20
  `).all();

  res.json(keywords);
});

router.post('/opinions/scan', (req, res) => {
  const mockOpinions = [
    { keyword: '拖欠工资', content: '这家店经常拖欠工资，要了好几次才给', sentiment: 'negative', source: '脉脉' },
    { keyword: '服务态度差', content: '店员态度很不好，点餐等了半小时', sentiment: 'negative', source: '大众点评' },
    { keyword: '加班严重', content: '天天加班到10点，没有加班费', sentiment: 'negative', source: '脉脉' },
    { keyword: '环境差', content: '工作环境很差，厨房很脏', sentiment: 'negative', source: '大众点评' },
    { keyword: '福利好', content: '五险一金都交，还有年终奖', sentiment: 'positive', source: '脉脉' }
  ];

  const companies = db.prepare('SELECT id FROM companies').all();

  let added = 0;
  for (const op of mockOpinions) {
    const randomCompany = companies[Math.floor(Math.random() * companies.length)];
    db.prepare(`
      INSERT INTO public_opinions (company_id, source, keyword, content, sentiment, url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(randomCompany.id, op.source, op.keyword, op.content, op.sentiment, `https://example.com/${Date.now()}`);
    added++;
  }

  res.json({ scanned: added, message: `成功扫描并新增${added}条舆情数据` });
});

router.get('/suspicious-jobs', (req, res) => {
  const jobs = db.prepare(`
    SELECT j.*, c.name as company_name, c.credit_score
    FROM jobs j
    LEFT JOIN companies c ON j.company_id = c.id
    WHERE j.is_suspicious = 1
    ORDER BY j.created_at DESC
  `).all();

  res.json(jobs);
});

router.put('/jobs/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended', 'closed'].includes(status)) {
    return res.status(400).json({ error: '无效状态' });
  }

  db.prepare('UPDATE jobs SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ status: 'success' });
});

router.get('/companies/credit-warning', (req, res) => {
  const companies = db.prepare(`
    SELECT * FROM companies
    WHERE credit_score < 3.5 OR turnover_rate > 0.3 OR social_insurance_rate < 0.6
    ORDER BY credit_score ASC
  `).all();

  res.json(companies);
});

router.get('/interviews/recordings', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;

  const countSql = 'SELECT COUNT(*) as count FROM interviews WHERE recording_url IS NOT NULL';
  const total = db.prepare(countSql).get().count;

  const interviews = db.prepare(`
    SELECT i.*, a.job_id, a.seeker_id, j.title, 
           c.name as company_name, js.name as seeker_name
    FROM interviews i
    LEFT JOIN applications a ON i.application_id = a.id
    LEFT JOIN jobs j ON a.job_id = j.id
    LEFT JOIN companies c ON j.company_id = c.id
    LEFT JOIN job_seekers js ON a.seeker_id = js.id
    WHERE i.recording_url IS NOT NULL
    ORDER BY i.created_at DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  for (const iv of interviews) {
    try {
      iv.key_promises = JSON.parse(iv.key_promises || '[]');
    } catch (e) {
      iv.key_promises = [];
    }
  }

  res.json({ interviews, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/seekers/top-rated', (req, res) => {
  const seekers = db.prepare(`
    SELECT * FROM job_seekers
    WHERE review_count >= 3
    ORDER BY rating DESC
    LIMIT 20
  `).all();

  res.json(seekers);
});

module.exports = router;
