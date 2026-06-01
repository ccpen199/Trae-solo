const express = require('express');
const db = require('../database');
const router = express.Router();

router.get('/extraction/:extractionId', (req, res) => {
  const stmt = db.prepare('SELECT * FROM notifications WHERE extraction_id = ? ORDER BY is_alternate, id');
  const notifications = stmt.all(req.params.extractionId);
  res.json(notifications);
});

router.put('/:id/status', (req, res) => {
  const { status, reject_reason } = req.body;

  if (!['accepted', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: '无效的状态值' });
  }

  const checkStmt = db.prepare('SELECT * FROM notifications WHERE id = ?');
  const existing = checkStmt.get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: '通知不存在' });
  }

  const stmt = db.prepare(`
    UPDATE notifications SET
      status = ?,
      reject_reason = ?,
      response_time = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(status, reject_reason, req.params.id);

  req.audit('notification', 'notification', req.params.id, {
    expert_name: existing.expert_name,
    status,
    reject_reason
  });

  res.json({ message: '状态更新成功' });
});

router.post('/extraction/:extractionId/re-extract', (req, res) => {
  const { reason, operator } = req.body;

  const extractionStmt = db.prepare('SELECT * FROM extraction_records WHERE id = ?');
  const extraction = extractionStmt.get(req.params.extractionId);
  if (!extraction) {
    return res.status(404).json({ error: '抽取记录不存在' });
  }

  req.audit('re-extract', 'extraction', extraction.id, {
    project_id: extraction.project_id,
    reason: reason || '专家拒绝参与',
    operator: operator || 'admin'
  });

  res.json({ message: '重新抽取已记录，请调用项目抽取接口执行新的抽取' });
});

module.exports = router;
