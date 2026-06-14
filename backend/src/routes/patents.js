import { Router } from 'express';
import { getDB } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, (req, res) => {
  const db = getDB();
  const { legal_status, patent_type, keyword, page = 1, pageSize = 20 } = req.query;

  let whereClause = 'WHERE user_id = ?';
  let params = [req.user.id];

  if (legal_status) {
    whereClause += ' AND legal_status = ?';
    params.push(legal_status);
  }
  if (patent_type) {
    whereClause += ' AND patent_type = ?';
    params.push(patent_type);
  }
  if (keyword) {
    whereClause += ' AND (patent_name LIKE ? OR patent_number LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const count = db.prepare(`SELECT COUNT(*) as total FROM patents ${whereClause}`).get(...params).total;
  const offset = (page - 1) * pageSize;
  const patents = db.prepare(`
    SELECT * FROM patents ${whereClause}
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({
    data: patents,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total: count,
      totalPages: Math.ceil(count / pageSize)
    }
  });
});

router.get('/:id', authenticateToken, (req, res) => {
  const db = getDB();
  const patent = db.prepare('SELECT * FROM patents WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

  if (!patent) {
    return res.status(404).json({ error: '专利不存在' });
  }

  const feeReminders = db.prepare('SELECT * FROM patent_fee_reminders WHERE patent_id = ? ORDER BY due_date').all(req.params.id);

  res.json({ ...patent, feeReminders });
});

router.post('/', authenticateToken, (req, res) => {
  const db = getDB();
  const { patent_name, patent_type, inventor, attorney, abstract } = req.body;

  if (!patent_name || !patent_type) {
    return res.status(400).json({ error: '专利名称和类型不能为空' });
  }

  const applicationNumber = '2024' + Math.floor(Math.random() * 10000000) + '.X';

  const result = db.prepare(`
    INSERT INTO patents (user_id, patent_name, patent_type, application_number, legal_status, application_date, inventor, attorney, abstract, next_fee_due_date)
    VALUES (?, ?, ?, ?, 'pending', date('now'), ?, ?, ?, date('now', '+1 year'))
  `).run(req.user.id, patent_name, patent_type, applicationNumber, inventor, attorney, abstract);

  const patent = db.prepare('SELECT * FROM patents WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(patent);
});

router.get('/legal-status/:id', authenticateToken, (req, res) => {
  const db = getDB();
  const patent = db.prepare('SELECT id, patent_name, legal_status, application_date, grant_date, expiry_date FROM patents WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

  if (!patent) {
    return res.status(404).json({ error: '专利不存在' });
  }

  const statusHistory = [
    { date: patent.application_date, status: '申请提交', description: '专利申请已提交至知识产权局' },
    { date: patent.application_date && new Date(patent.application_date).toISOString().split('T')[0], status: '初审通过', description: '形式审查通过，进入公布阶段' },
    { date: patent.grant_date || null, status: '授权公告', description: patent.grant_date ? '专利已获得授权' : '待授权' }
  ].filter(s => s.date);

  res.json({
    patent,
    currentStatus: patent.legal_status,
    statusHistory
  });
});

router.get('/fees/reminders', authenticateToken, (req, res) => {
  const db = getDB();
  const { status } = req.query;

  let whereClause = 'WHERE p.user_id = ?';
  let params = [req.user.id];

  if (status) {
    whereClause += ' AND r.status = ?';
    params.push(status);
  }

  const reminders = db.prepare(`
    SELECT r.*, p.patent_name, p.patent_number, p.patent_type
    FROM patent_fee_reminders r
    JOIN patents p ON r.patent_id = p.id
    ${whereClause}
    ORDER BY r.due_date ASC
  `).all(...params);

  const upcoming = reminders.filter(r => {
    const due = new Date(r.due_date);
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 90;
  });

  res.json({
    data: reminders,
    upcomingCount: upcoming.length,
    overdueCount: reminders.filter(r => new Date(r.due_date) < new Date() && r.status === 'pending').length
  });
});

router.post('/fees/:id/pay', authenticateToken, (req, res) => {
  const db = getDB();
  const reminder = db.prepare(`
    SELECT r.* FROM patent_fee_reminders r
    JOIN patents p ON r.patent_id = p.id
    WHERE r.id = ? AND p.user_id = ?
  `).get(req.params.id, req.user.id);

  if (!reminder) {
    return res.status(404).json({ error: '缴费记录不存在' });
  }

  db.prepare('UPDATE patent_fee_reminders SET status = ?, paid_date = date("now") WHERE id = ?').run('paid', req.params.id);

  res.json({ message: '缴费已确认' });
});

router.get('/valuation/:id', authenticateToken, (req, res) => {
  const db = getDB();
  const patent = db.prepare('SELECT * FROM patents WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

  if (!patent) {
    return res.status(404).json({ error: '专利不存在' });
  }

  const factors = [
    { name: '技术先进性', score: 85, weight: 0.3 },
    { name: '市场应用前景', score: 78, weight: 0.25 },
    { name: '权利稳定性', score: 92, weight: 0.2 },
    { name: '剩余保护期限', score: 88, weight: 0.15 },
    { name: '行业发展趋势', score: 82, weight: 0.1 }
  ];

  const totalScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  const estimatedValue = totalScore * 10000;

  res.json({
    patentId: patent.id,
    patentName: patent.patent_name,
    valueEstimation: estimatedValue,
    totalScore,
    factors,
    valuationMethod: '收益法+市场法综合评估',
    valuationDate: new Date().toISOString().split('T')[0],
    disclaimer: '本评估仅供参考，实际价值需专业评估机构确认'
  });
});

export default router;
