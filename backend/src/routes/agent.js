const express = require('express');
const router = express.Router();
const db = require('../utils/db');

router.post('/authorize', (req, res) => {
  const { principalId, agentId, authScope, startTime, endTime, requireConfirm } = req.body;

  if (!principalId || !agentId || !authScope || !startTime || !endTime) {
    return res.status(400).json({ code: 400, message: '参数不完整' });
  }

  const principal = db.prepare('SELECT * FROM users WHERE id = ?').get(principalId);
  const agent = db.prepare('SELECT * FROM users WHERE id = ?').get(agentId);

  if (!principal || !agent) {
    return res.status(404).json({ code: 404, message: '用户不存在' });
  }

  const result = db.prepare(`
    INSERT INTO agent_authorizations (principal_id, agent_id, auth_scope, start_time, end_time, status, require_confirm)
    VALUES (?, ?, ?, ?, ?, 'active', ?)
  `).run(
    principalId,
    agentId,
    JSON.stringify(authScope),
    startTime,
    endTime,
    requireConfirm ? 1 : 0
  );

  res.json({
    code: 200,
    data: {
      id: result.lastInsertRowid,
      message: '授权成功'
    }
  });
});

router.get('/principal/:userId', (req, res) => {
  const { userId } = req.params;

  const list = db.prepare(`
    SELECT aa.*, u.real_name as agent_name, u.phone as agent_phone
    FROM agent_authorizations aa
    LEFT JOIN users u ON aa.agent_id = u.id
    WHERE aa.principal_id = ?
    ORDER BY aa.created_at DESC
  `).all(userId);

  const result = list.map(item => ({
    ...item,
    auth_scope: JSON.parse(item.auth_scope || '[]')
  }));

  res.json({ code: 200, data: result });
});

router.get('/agent/:userId', (req, res) => {
  const { userId } = req.params;

  const list = db.prepare(`
    SELECT aa.*, u.real_name as principal_name, u.phone as principal_phone
    FROM agent_authorizations aa
    LEFT JOIN users u ON aa.principal_id = u.id
    WHERE aa.agent_id = ? AND aa.status = 'active'
    ORDER BY aa.created_at DESC
  `).all(userId);

  const result = list.map(item => ({
    ...item,
    auth_scope: JSON.parse(item.auth_scope || '[]')
  }));

  res.json({ code: 200, data: result });
});

router.post('/operation', (req, res) => {
  const { authId, operationType, operationDetail } = req.body;

  const auth = db.prepare('SELECT * FROM agent_authorizations WHERE id = ?').get(authId);
  if (!auth) {
    return res.status(404).json({ code: 404, message: '授权不存在' });
  }

  if (auth.status !== 'active') {
    return res.status(400).json({ code: 400, message: '授权已失效' });
  }

  const now = new Date();
  if (now < new Date(auth.start_time) || now > new Date(auth.end_time)) {
    return res.status(400).json({ code: 400, message: '不在授权有效期内' });
  }

  const result = db.prepare(`
    INSERT INTO agent_operations (auth_id, operation_type, operation_detail, is_confirmed)
    VALUES (?, ?, ?, ?)
  `).run(authId, operationType, operationDetail, auth.require_confirm ? 0 : 1);

  res.json({
    code: 200,
    data: {
      id: result.lastInsertRowid,
      require_confirm: auth.require_confirm === 1,
      message: auth.require_confirm ? '操作已提交，等待委托人确认' : '操作已执行'
    }
  });
});

router.get('/operations/:authId', (req, res) => {
  const { authId } = req.params;
  const { page = 1, pageSize = 20 } = req.query;

  const list = db.prepare(`
    SELECT * FROM agent_operations
    WHERE auth_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(authId, parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const total = db.prepare('SELECT COUNT(*) as count FROM agent_operations WHERE auth_id = ?').get(authId).count;

  res.json({ code: 200, data: list, total });
});

router.post('/confirm', (req, res) => {
  const { operationId, confirmed } = req.body;

  const operation = db.prepare('SELECT * FROM agent_operations WHERE id = ?').get(operationId);
  if (!operation) {
    return res.status(404).json({ code: 404, message: '操作记录不存在' });
  }

  db.prepare(`
    UPDATE agent_operations SET is_confirmed = ? WHERE id = ?
  `).run(confirmed ? 1 : 0, operationId);

  res.json({
    code: 200,
    data: {
      message: confirmed ? '已确认' : '已拒绝'
    }
  });
});

router.post('/revoke', (req, res) => {
  const { authId } = req.body;

  db.prepare(`
    UPDATE agent_authorizations SET status = 'revoked' WHERE id = ?
  `).run(authId);

  res.json({
    code: 200,
    data: { message: '授权已撤销' }
  });
});

module.exports = router;
