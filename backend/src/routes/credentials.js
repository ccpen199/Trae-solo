const express = require('express');
const { getDb } = require('../database/schema');
const { authenticateToken, canAccessCredential, logAction } = require('../middleware/auth');
const { encrypt, decrypt, maskValue } = require('../utils/encryption');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { project_id, type, search } = req.query;
  
  let query = `
    SELECT 
      c.id, c.title, c.type, c.project_id, c.username, 
      c.expires_at, c.last_rotated_at, c.is_frozen, c.created_at,
      p.name as project_name, t.name as team_name,
      u.username as creator_name
    FROM credentials c
    JOIN projects p ON c.project_id = p.id
    JOIN teams t ON p.team_id = t.id
    JOIN users u ON c.created_by = u.id
    JOIN team_members tm ON t.id = tm.team_id
    WHERE tm.user_id = ?
  `;
  const params = [req.user.id];

  if (project_id) {
    query += ' AND c.project_id = ?';
    params.push(project_id);
  }
  if (type) {
    query += ' AND c.type = ?';
    params.push(type);
  }
  if (search) {
    query += ' AND (c.title LIKE ? OR c.username LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY c.created_at DESC';
  
  const credentials = db.prepare(query).all(...params);
  
  const maskedCredentials = credentials.map(c => ({
    ...c,
    username: maskValue(c.username, 'email')
  }));

  res.json({ credentials: maskedCredentials });
});

router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  if (!canAccessCredential(req.user.id, id)) {
    return res.status(403).json({ error: '无权访问此凭据' });
  }

  const db = getDb();
  const credential = db.prepare(`
    SELECT 
      c.*, p.name as project_name, t.name as team_name,
      u.username as creator_name
    FROM credentials c
    JOIN projects p ON c.project_id = p.id
    JOIN teams t ON p.team_id = t.id
    JOIN users u ON c.created_by = u.id
    WHERE c.id = ?
  `).get(id);

  if (!credential) {
    return res.status(404).json({ error: '凭据不存在' });
  }

  const attachments = db.prepare(`
    SELECT id, filename, file_type, file_size, created_at
    FROM credential_attachments
    WHERE credential_id = ?
  `).all(id);

  const maskedCredential = {
    ...credential,
    username: maskValue(credential.username, 'email'),
    encrypted_password: '****',
    encrypted_token: credential.encrypted_token ? maskValue('token_sample', 'token') : null,
    attachments
  };

  res.json({ credential: maskedCredential });
});

router.get('/:id/reveal', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { request_id } = req.query;
  
  if (!canAccessCredential(req.user.id, id)) {
    return res.status(403).json({ error: '无权访问此凭据' });
  }

  const db = getDb();
  const credential = db.prepare('SELECT * FROM credentials WHERE id = ?').get(id);

  if (!credential) {
    return res.status(404).json({ error: '凭据不存在' });
  }

  if (credential.is_frozen) {
    return res.status(403).json({ error: '此凭据已被冻结' });
  }

  const watermark = `${req.user.username}-${Date.now()}`;

  db.prepare(`
    INSERT INTO credential_views (credential_id, viewer_id, request_id, view_type, watermark)
    VALUES (?, ?, ?, 'reveal', ?)
  `).run(id, req.user.id, request_id || null, watermark);

  logAction(req, 'reveal_credential', 'credential', id, { watermark });

  const revealed = {
    id: credential.id,
    title: credential.title,
    username: credential.username,
    password: credential.encrypted_password ? decrypt(credential.encrypted_password, process.env.ENCRYPTION_KEY) : null,
    token: credential.encrypted_token ? decrypt(credential.encrypted_token, process.env.ENCRYPTION_KEY) : null,
    certificate: credential.encrypted_certificate ? decrypt(credential.encrypted_certificate, process.env.ENCRYPTION_KEY) : null,
    connection_string: credential.connection_string,
    hostname: credential.hostname,
    port: credential.port,
    database_name: credential.database_name,
    notes: credential.notes,
    watermark
  };

  res.json({ credential: revealed });
});

router.post('/:id/copy', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { field } = req.body;
  
  if (!canAccessCredential(req.user.id, id)) {
    return res.status(403).json({ error: '无权访问此凭据' });
  }

  const db = getDb();
  
  db.prepare(`
    UPDATE credential_views 
    SET copied = 1 
    WHERE credential_id = ? AND viewer_id = ?
    ORDER BY created_at DESC LIMIT 1
  `).run(id, req.user.id);

  logAction(req, 'copy_credential', 'credential', id, { field });

  res.json({ message: '已记录复制操作' });
});

router.post('/', authenticateToken, (req, res) => {
  const {
    title, type, project_id, username, password, token, certificate,
    connection_string, hostname, port, database_name, notes,
    expires_at, rotation_period_days
  } = req.body;

  if (!title || !type || !project_id) {
    return res.status(400).json({ error: '标题、类型和项目不能为空' });
  }

  if (!expires_at) {
    return res.status(400).json({ error: '过期日期不能为空' });
  }

  if (password && password.length < 6) {
    return res.status(400).json({ error: '密码至少需要6位' });
  }

  if (token && token.length < 10) {
    return res.status(400).json({ error: 'Token至少需要10位' });
  }

  const db = getDb();
  const encryptedPassword = password ? encrypt(password, process.env.ENCRYPTION_KEY) : null;
  const encryptedToken = token ? encrypt(token, process.env.ENCRYPTION_KEY) : null;
  const encryptedCertificate = certificate ? encrypt(certificate, process.env.ENCRYPTION_KEY) : null;

  const result = db.prepare(`
    INSERT INTO credentials (
      title, type, project_id, username, encrypted_password, encrypted_token,
      encrypted_certificate, connection_string, hostname, port, database_name,
      notes, expires_at, rotation_period_days, created_by, last_rotated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    title, type, project_id, username, encryptedPassword, encryptedToken,
    encryptedCertificate, connection_string, hostname, port, database_name,
    notes, expires_at, rotation_period_days || 90, req.user.id
  );

  const credentialId = result.lastInsertRowid;
  logAction(req, 'create_credential', 'credential', credentialId, { type });

  res.json({ id: credentialId, message: '凭据创建成功' });
});

router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  if (!canAccessCredential(req.user.id, id)) {
    return res.status(403).json({ error: '无权修改此凭据' });
  }

  const db = getDb();
  const {
    title, type, project_id, username, password, token, certificate,
    connection_string, hostname, port, database_name, notes,
    expires_at, rotation_period_days
  } = req.body;

  if (expires_at !== undefined && !expires_at) {
    return res.status(400).json({ error: '过期日期不能为空' });
  }

  if (password && password.length < 6) {
    return res.status(400).json({ error: '密码至少需要6位' });
  }

  if (token && token.length < 10) {
    return res.status(400).json({ error: 'Token至少需要10位' });
  }

  const updates = [];
  const params = [];

  if (title) { updates.push('title = ?'); params.push(title); }
  if (type) { updates.push('type = ?'); params.push(type); }
  if (project_id) { updates.push('project_id = ?'); params.push(project_id); }
  if (username !== undefined) { updates.push('username = ?'); params.push(username); }
  if (password && password.trim()) { 
    updates.push('encrypted_password = ?'); 
    params.push(encrypt(password.trim(), process.env.ENCRYPTION_KEY));
    updates.push('last_rotated_at = CURRENT_TIMESTAMP');
  }
  if (token && token.trim()) { 
    updates.push('encrypted_token = ?'); 
    params.push(encrypt(token.trim(), process.env.ENCRYPTION_KEY));
  }
  if (certificate && certificate.trim()) { 
    updates.push('encrypted_certificate = ?'); 
    params.push(encrypt(certificate.trim(), process.env.ENCRYPTION_KEY));
  }
  if (connection_string !== undefined) { updates.push('connection_string = ?'); params.push(connection_string); }
  if (hostname !== undefined) { updates.push('hostname = ?'); params.push(hostname); }
  if (port !== undefined) { updates.push('port = ?'); params.push(port); }
  if (database_name !== undefined) { updates.push('database_name = ?'); params.push(database_name); }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
  if (expires_at !== undefined) { updates.push('expires_at = ?'); params.push(expires_at); }
  if (rotation_period_days) { updates.push('rotation_period_days = ?'); params.push(rotation_period_days); }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  db.prepare(`UPDATE credentials SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  
  logAction(req, 'update_credential', 'credential', id);
  res.json({ message: '凭据更新成功' });
});

router.post('/:id/freeze', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '只有管理员可以冻结凭据' });
  }

  const db = getDb();
  db.prepare(`
    UPDATE credentials 
    SET is_frozen = 1, frozen_at = CURRENT_TIMESTAMP, frozen_by = ?
    WHERE id = ?
  `).run(req.user.id, id);

  logAction(req, 'freeze_credential', 'credential', id);
  res.json({ message: '凭据已冻结' });
});

router.post('/:id/unfreeze', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '只有管理员可以解冻凭据' });
  }

  const db = getDb();
  db.prepare(`
    UPDATE credentials 
    SET is_frozen = 0, frozen_at = NULL, frozen_by = NULL
    WHERE id = ?
  `).run(id);

  logAction(req, 'unfreeze_credential', 'credential', id);
  res.json({ message: '凭据已解冻' });
});

router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  const db = getDb();
  const credential = db.prepare('SELECT created_by FROM credentials WHERE id = ?').get(id);
  
  if (!credential) {
    return res.status(404).json({ error: '凭据不存在' });
  }
  
  if (credential.created_by !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '只有创建者或管理员可以删除凭据' });
  }

  db.prepare('DELETE FROM credentials WHERE id = ?').run(id);
  logAction(req, 'delete_credential', 'credential', id);
  
  res.json({ message: '凭据已删除' });
});

module.exports = router;
