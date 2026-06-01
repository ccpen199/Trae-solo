import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/customer/:customerId', (req, res) => {
  const auths = db.prepare(`
    SELECT ca.*, u.name as creator_name
    FROM credit_authorizations ca
    LEFT JOIN users u ON ca.created_by = u.id
    WHERE ca.customer_id = ?
    ORDER BY ca.created_at DESC
  `).all(req.params.customerId);
  res.json(auths);
});

router.post('/customer/:customerId', (req, res) => {
  const { borrower_type, created_by } = req.body;
  const customerId = req.params.customerId;

  try {
    const result = db.prepare(`
      INSERT INTO credit_authorizations (customer_id, borrower_type, status, created_by)
      VALUES (?, ?, 'pending', ?)
    `).run(customerId, borrower_type || 'main', created_by);

    res.json({ id: result.lastInsertRowid, message: '授权记录创建成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/query', (req, res) => {
  const auth = db.prepare('SELECT * FROM credit_authorizations WHERE id = ?').get(req.params.id);
  if (!auth) {
    return res.status(404).json({ error: '授权记录不存在' });
  }

  const success = Math.random() > 0.2;
  const queryTime = new Date().toISOString();
  const expireTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  if (success) {
    const creditReport = JSON.stringify({
      score: Math.floor(Math.random() * 150) + 700,
      scoreLevel: Math.random() > 0.5 ? 'A' : 'B',
      overdueCount: Math.floor(Math.random() * 3),
      totalLoanAmount: (Math.random() * 200 + 50).toFixed(2) + '万',
      creditCardCount: Math.floor(Math.random() * 5) + 1,
      queryCount: Math.floor(Math.random() * 10) + 1,
      riskLevel: Math.random() > 0.7 ? '中风险' : '低风险',
      suggestion: Math.random() > 0.5 ? '建议正常审批' : '建议关注还款能力',
      reportNo: 'CR' + Date.now(),
      reportTime: queryTime
    });

    db.prepare(`
      UPDATE credit_authorizations 
      SET status = 'success', query_time = ?, expire_time = ?, credit_report = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(queryTime, expireTime, creditReport, req.params.id);
    res.json({ status: 'success', message: '征信查询成功' });
  } else {
    const failReasons = ['征信系统连接超时', '客户信息不匹配', '授权文件无效', '其他系统错误'];
    const failReason = failReasons[Math.floor(Math.random() * failReasons.length)];
    
    db.prepare(`
      UPDATE credit_authorizations 
      SET status = 'failed', fail_reason = ?, query_time = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(failReason, queryTime, req.params.id);
    
    res.json({ status: 'failed', fail_reason: failReason, message: '征信查询失败' });
  }
});

export default router;
