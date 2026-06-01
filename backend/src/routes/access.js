const express = require('express');
const { getDb } = require('../database/schema');
const { authenticateToken, canAccessCredential, logAction } = require('../middleware/auth');

const router = express.Router();

router.get('/requests', authenticateToken, (req, res) => {
  const db = getDb();
  const { status } = req.query;
  
  let query = `
    SELECT ar.*, 
      c.title as credential_title,
      u.username as requester_name,
      ap.username as approver_name
    FROM access_requests ar
    JOIN credentials c ON ar.credential_id = c.id
    JOIN users u ON ar.requester_id = u.id
    LEFT JOIN users ap ON ar.approver_id = ap.id
    WHERE ar.requester_id = ?
  `;
  const params = [req.user.id];

  if (status) {
    query += ' AND ar.status = ?';
    params.push(status);
  }

  query += ' ORDER BY ar.created_at DESC';
  
  const requests = db.prepare(query).all(...params);
  res.json({ requests });
});

router.get('/requests/pending', authenticateToken, (req, res) => {
  const db = getDb();
  
  const requests = db.prepare(`
    SELECT ar.*, 
      c.title as credential_title,
      u.username as requester_name
    FROM access_requests ar
    JOIN credentials c ON ar.credential_id = c.id
    JOIN users u ON ar.requester_id = u.id
    JOIN projects p ON c.project_id = p.id
    JOIN team_members tm ON p.team_id = tm.team_id
    WHERE ar.status = 'pending'
      AND tm.user_id = ?
      AND tm.role IN ('admin', 'owner')
    ORDER BY ar.created_at DESC
  `).all(req.user.id);

  res.json({ requests });
});

router.post('/requests', authenticateToken, (req, res) => {
  const { credential_id, reason, expires_at, scope = 'view' } = req.body;
  
  if (!credential_id || !reason || !expires_at) {
    return res.status(400).json({ error: '凭据ID、理由和到期时间不能为空' });
  }

  if (!canAccessCredential(req.user.id, credential_id)) {
    return res.status(403).json({ error: '无权申请访问此凭据' });
  }

  const db = getDb();
  
  const existing = db.prepare(`
    SELECT 1 FROM access_requests 
    WHERE credential_id = ? AND requester_id = ? AND status = 'pending'
  `).get(credential_id, req.user.id);

  if (existing) {
    return res.status(400).json({ error: '已有待审批的申请' });
  }

  const credential = db.prepare(`
    SELECT c.id, p.team_id
    FROM credentials c
    JOIN projects p ON c.project_id = p.id
    WHERE c.id = ?
  `).get(credential_id);

  const approver = db.prepare(`
    SELECT u.id
    FROM team_members tm
    JOIN users u ON tm.user_id = u.id
    WHERE tm.team_id = ? AND tm.role = 'admin'
    LIMIT 1
  `).get(credential.team_id);

  const result = db.prepare(`
    INSERT INTO access_requests (
      credential_id, requester_id, approver_id, reason, scope, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(credential_id, req.user.id, approver?.id, reason, scope, expires_at);

  logAction(req, 'create_access_request', 'credential', credential_id);
  res.json({ id: result.lastInsertRowid, message: '访问申请已提交' });
});

router.post('/requests/:id/approve', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  const db = getDb();
  const request = db.prepare('SELECT * FROM access_requests WHERE id = ?').get(id);
  
  if (!request) {
    return res.status(404).json({ error: '申请不存在' });
  }

  const credential = db.prepare(`
    SELECT c.id, p.team_id
    FROM credentials c
    JOIN projects p ON c.project_id = p.id
    WHERE c.id = ?
  `).get(request.credential_id);

  const isApprover = db.prepare(`
    SELECT 1 FROM team_members 
    WHERE team_id = ? AND user_id = ? AND role = 'admin'
  `).get(credential.team_id, req.user.id);

  if (!isApprover && req.user.role !== 'admin') {
    return res.status(403).json({ error: '只有团队管理员可以审批' });
  }

  db.prepare(`
    UPDATE access_requests 
    SET status = 'approved', approver_id = ?, approved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.user.id, id);

  db.prepare(`
    INSERT OR IGNORE INTO access_grants (credential_id, user_id, granted_by, role, expires_at)
    VALUES (?, ?, ?, 'viewer', ?)
  `).run(request.credential_id, request.requester_id, req.user.id, request.expires_at);

  logAction(req, 'approve_access_request', 'access_request', id);
  res.json({ message: '申请已批准' });
});

router.post('/requests/:id/deny', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { deny_reason } = req.body;
  
  const db = getDb();
  const request = db.prepare('SELECT * FROM access_requests WHERE id = ?').get(id);
  
  if (!request) {
    return res.status(404).json({ error: '申请不存在' });
  }

  const credential = db.prepare(`
    SELECT c.id, p.team_id
    FROM credentials c
    JOIN projects p ON c.project_id = p.id
    WHERE c.id = ?
  `).get(request.credential_id);

  const isApprover = db.prepare(`
    SELECT 1 FROM team_members 
    WHERE team_id = ? AND user_id = ? AND role = 'admin'
  `).get(credential.team_id, req.user.id);

  if (!isApprover && req.user.role !== 'admin') {
    return res.status(403).json({ error: '只有团队管理员可以拒绝' });
  }

  db.prepare(`
    UPDATE access_requests 
    SET status = 'denied', approver_id = ?, denied_at = CURRENT_TIMESTAMP, deny_reason = ?
    WHERE id = ?
  `).run(req.user.id, deny_reason, id);

  logAction(req, 'deny_access_request', 'access_request', id);
  res.json({ message: '申请已拒绝' });
});

router.get('/grants', authenticateToken, (req, res) => {
  const db = getDb();
  
  const grants = db.prepare(`
    SELECT ag.*,
      c.title as credential_title,
      u.username as user_name,
      g.username as granted_by_name
    FROM access_grants ag
    JOIN credentials c ON ag.credential_id = c.id
    JOIN users u ON ag.user_id = u.id
    JOIN users g ON ag.granted_by = g.id
    WHERE ag.user_id = ? OR ag.granted_by = ?
    ORDER BY ag.created_at DESC
  `).all(req.user.id, req.user.id);

  res.json({ grants });
});

router.post('/grants', authenticateToken, (req, res) => {
  const { credential_id, user_id, role = 'viewer', expires_at } = req.body;
  
  if (!credential_id || !user_id) {
    return res.status(400).json({ error: '凭据ID和用户ID不能为空' });
  }

  if (!canAccessCredential(req.user.id, credential_id)) {
    return res.status(403).json({ error: '无权分享此凭据' });
  }

  const db = getDb();
  
  try {
    db.prepare(`
      INSERT INTO access_grants (credential_id, user_id, granted_by, role, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(credential_id, user_id, req.user.id, role, expires_at);

    logAction(req, 'create_access_grant', 'credential', credential_id, { user_id, role });
    res.json({ message: '权限已授予' });
  } catch (err) {
    res.status(400).json({ error: '该用户已有访问权限' });
  }
});

router.delete('/grants/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  const db = getDb();
  const grant = db.prepare('SELECT * FROM access_grants WHERE id = ?').get(id);
  
  if (!grant) {
    return res.status(404).json({ error: '授权不存在' });
  }

  if (grant.granted_by !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '只有授权者或管理员可以撤销' });
  }

  db.prepare('DELETE FROM access_grants WHERE id = ?').run(id);
  logAction(req, 'revoke_access_grant', 'access_grant', id);
  
  res.json({ message: '授权已撤销' });
});

router.get('/audit', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '只有管理员可以查看审计日志' });
  }

  const db = getDb();
  const { action, resource_type, user_id, limit = 100, offset = 0 } = req.query;
  
  let query = `
    SELECT al.*, u.username as user_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (action) {
    query += ' AND al.action = ?';
    params.push(action);
  }
  if (resource_type) {
    query += ' AND al.resource_type = ?';
    params.push(resource_type);
  }
  if (user_id) {
    query += ' AND al.user_id = ?';
    params.push(user_id);
  }

  query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  const logs = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get();

  res.json({ logs, total: total.count });
});

router.get('/views/:credentialId', authenticateToken, (req, res) => {
  const { credentialId } = req.params;
  
  if (!canAccessCredential(req.user.id, credentialId)) {
    return res.status(403).json({ error: '无权查看此信息' });
  }

  const db = getDb();
  const views = db.prepare(`
    SELECT cv.*, u.username as viewer_name
    FROM credential_views cv
    JOIN users u ON cv.viewer_id = u.id
    WHERE cv.credential_id = ?
    ORDER BY cv.created_at DESC
    LIMIT 50
  `).all(credentialId);

  res.json({ views });
});

module.exports = router;
