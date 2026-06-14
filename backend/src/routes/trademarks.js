import { Router } from 'express';
import { getDB } from '../db.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, (req, res) => {
  const db = getDB();
  const { status, risk_level, keyword, page = 1, pageSize = 20 } = req.query;

  let whereClause = 'WHERE user_id = ?';
  let params = [req.user.id];

  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }
  if (risk_level) {
    whereClause += ' AND risk_level = ?';
    params.push(risk_level);
  }
  if (keyword) {
    whereClause += ' AND (trademark_name LIKE ? OR registration_number LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const count = db.prepare(`SELECT COUNT(*) as total FROM trademarks ${whereClause}`).get(...params).total;
  const offset = (page - 1) * pageSize;
  const trademarks = db.prepare(`
    SELECT * FROM trademarks ${whereClause}
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({
    data: trademarks,
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
  const trademark = db.prepare('SELECT * FROM trademarks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

  if (!trademark) {
    return res.status(404).json({ error: '商标不存在' });
  }

  res.json(trademark);
});

router.post('/', authenticateToken, (req, res) => {
  const db = getDB();
  const { trademark_name, category, owner, notes } = req.body;

  if (!trademark_name) {
    return res.status(400).json({ error: '商标名称不能为空' });
  }

  const result = db.prepare(`
    INSERT INTO trademarks (user_id, trademark_name, category, owner, notes, status, application_date)
    VALUES (?, ?, ?, ?, ?, 'pending', date('now'))
  `).run(req.user.id, trademark_name, category, owner, notes);

  const trademark = db.prepare('SELECT * FROM trademarks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(trademark);
});

router.post('/search', authenticateToken, (req, res) => {
  const { keyword, category } = req.body;

  if (!keyword) {
    return res.status(400).json({ error: '检索关键词不能为空' });
  }

  const mockResults = [
    { name: keyword + '达', category: category || '第42类', status: '已注册', similarity: 85 },
    { name: keyword + '通', category: category || '第42类', status: '已注册', similarity: 72 },
    { name: keyword + '宝', category: category || '第35类', status: '申请中', similarity: 65 },
    { name: keyword + '优', category: category || '第9类', status: '已注册', similarity: 58 }
  ];

  const riskScore = Math.min(95, 30 + mockResults.filter(r => r.similarity > 70).length * 25);
  const riskLevel = riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low';

  const db = getDB();
  db.prepare(`
    INSERT INTO trademark_searches (user_id, keyword, category, results_count, risk_assessment)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, keyword, category, mockResults.length, `风险评分: ${riskScore}, 等级: ${riskLevel}`);

  res.json({
    keyword,
    category,
    results: mockResults,
    riskAssessment: {
      score: riskScore,
      level: riskLevel,
      suggestion: riskLevel === 'high' ? '不建议注册，风险较高' : riskLevel === 'medium' ? '建议调整名称或设计' : '可以考虑注册'
    }
  });
});

router.post('/apply', authenticateToken, (req, res) => {
  const db = getDB();
  const { trademark_name, category, applicant_name, applicant_type, contact_person, contact_phone, contact_email, applicant_address, id_card_no, business_license, trademark_design, priority_date, designated_goods, materials } = req.body;

  if (!trademark_name || !category || !applicant_name) {
    return res.status(400).json({ error: '商标名称、类别和申请人信息不能为空' });
  }

  const applicationNumber = 'A' + Date.now().toString().slice(-10);
  const riskScore = Math.floor(Math.random() * 30) + 10;
  const riskLevel = riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low';

  const result = db.prepare(`
    INSERT INTO trademarks (
      user_id, client_id, trademark_name, category, application_number,
      status, application_date, risk_score, risk_level, owner, attorney, notes
    ) VALUES (?, ?, ?, ?, ?, ?, date('now'), ?, ?, ?, ?, ?)
  `).run(
    req.user.id,
    null,
    trademark_name,
    category,
    applicationNumber,
    'pending',
    riskScore,
    riskLevel,
    applicant_name,
    '专业代理人',
    `申请人: ${applicant_name} (${applicant_type}), 联系人: ${contact_person}, 电话: ${contact_phone}`
  );

  db.prepare(`
    INSERT INTO notifications (user_id, type, title, message, related_type, related_id)
    VALUES (?, 'system', ?, ?, 'trademark', ?)
  `).run(
    req.user.id,
    '商标注册申请已提交',
    `您的商标"${trademark_name}"注册申请已提交，申请号：${applicationNumber}，我们将尽快处理。`,
    result.lastInsertRowid
  );

  res.json({
    applicationNumber,
    trademarkName: trademark_name,
    category,
    applicant: applicant_name,
    submitTime: new Date().toLocaleString('zh-CN'),
    trademarkId: result.lastInsertRowid
  });
});

router.post('/:id/apply', authenticateToken, (req, res) => {
  const db = getDB();
  const trademark = db.prepare('SELECT * FROM trademarks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

  if (!trademark) {
    return res.status(404).json({ error: '商标不存在' });
  }

  const applicationNumber = 'A' + Date.now().toString().slice(-10);
  db.prepare(`
    UPDATE trademarks SET status = 'examination', application_number = ?, application_date = date('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(applicationNumber, req.params.id);

  const updated = db.prepare('SELECT * FROM trademarks WHERE id = ?').get(req.params.id);
  res.json({ message: '注册申请已提交', trademark: updated });
});

router.get('/alerts/list', authenticateToken, (req, res) => {
  const db = getDB();
  const alerts = db.prepare(`
    SELECT t.*,
      CASE
        WHEN risk_score > 70 THEN '高风险'
        WHEN risk_score > 40 THEN '中风险'
        ELSE '低风险'
      END as risk_desc
    FROM trademarks t
    WHERE user_id = ? AND risk_score > 0
    ORDER BY risk_score DESC
  `).all(req.user.id);

  res.json({ data: alerts });
});

router.get('/transfers/list', authenticateToken, (req, res) => {
  const db = getDB();
  const transfers = db.prepare(`
    SELECT tt.*, t.trademark_name, t.registration_number
    FROM trademark_transfers tt
    JOIN trademarks t ON tt.trademark_id = t.id
    WHERE tt.assignor_id = ?
    ORDER BY tt.created_at DESC
  `).all(req.user.id);

  res.json({ data: transfers });
});

router.post('/transfers', authenticateToken, (req, res) => {
  const db = getDB();
  const { trademark_id, assignee_name, transfer_price, notes } = req.body;

  const trademark = db.prepare('SELECT * FROM trademarks WHERE id = ? AND user_id = ?').get(trademark_id, req.user.id);
  if (!trademark) {
    return res.status(404).json({ error: '商标不存在或无权转让' });
  }

  const result = db.prepare(`
    INSERT INTO trademark_transfers (trademark_id, assignor_id, assignee_name, transfer_price, status, agreement_date, notes)
    VALUES (?, ?, ?, ?, 'pending', date('now'), ?)
  `).run(trademark_id, req.user.id, assignee_name, transfer_price, notes);

  res.status(201).json({
    id: result.lastInsertRowid,
    message: '转让申请已提交'
  });
});

export default router;
