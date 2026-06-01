const express = require('express');
const { getDb } = require('../database/schema');
const { authenticateToken, requireRole, logAction } = require('../middleware/auth');
const zxcvbn = require('zxcvbn');

const router = express.Router();

function generateReminders() {
  const db = getDb();
  
  db.exec(`
    DELETE FROM rotation_reminders WHERE is_resolved = 0;
  `);

  const expired = db.prepare(`
    SELECT c.id, c.title, c.expires_at, u.username as creator_name
    FROM credentials c
    JOIN users u ON c.created_by = u.id
    WHERE c.expires_at IS NOT NULL 
      AND c.expires_at < datetime('now')
      AND c.is_frozen = 0
  `).all();

  expired.forEach(c => {
    db.prepare(`
      INSERT INTO rotation_reminders (credential_id, reminder_type, severity, message)
      VALUES (?, 'expired', 'critical', ?)
    `).run(c.id, `凭据"${c.title}"已过期`);
  });

  const expiringSoon = db.prepare(`
    SELECT c.id, c.title, c.expires_at, u.username as creator_name
    FROM credentials c
    JOIN users u ON c.created_by = u.id
    WHERE c.expires_at IS NOT NULL 
      AND c.expires_at BETWEEN datetime('now') AND datetime('now', '+7 days')
      AND c.is_frozen = 0
  `).all();

  expiringSoon.forEach(c => {
    db.prepare(`
      INSERT INTO rotation_reminders (credential_id, reminder_type, severity, message)
      VALUES (?, 'expiring_soon', 'warning', ?)
    `).run(c.id, `凭据"${c.title}"将在7天内过期`);
  });

  const longUnrotated = db.prepare(`
    SELECT c.id, c.title, c.last_rotated_at, c.rotation_period_days,
      u.username as creator_name
    FROM credentials c
    JOIN users u ON c.created_by = u.id
    WHERE c.last_rotated_at IS NOT NULL
      AND datetime(c.last_rotated_at, '+' || c.rotation_period_days || ' days') < datetime('now')
      AND c.is_frozen = 0
  `).all();

  longUnrotated.forEach(c => {
    db.prepare(`
      INSERT INTO rotation_reminders (credential_id, reminder_type, severity, message)
      VALUES (?, 'long_unrotated', 'high', ?)
    `).run(c.id, `凭据"${c.title}"已超过轮换周期`);
  });

  return true;
}

router.get('/reminders', authenticateToken, (req, res) => {
  const db = getDb();
  const { status, severity, limit = 50 } = req.query;

  generateReminders();

  let query = `
    SELECT r.*, 
      c.title as credential_title, c.type as credential_type,
      p.name as project_name, t.name as team_name
    FROM rotation_reminders r
    JOIN credentials c ON r.credential_id = c.id
    JOIN projects p ON c.project_id = p.id
    JOIN teams t ON p.team_id = t.id
    JOIN team_members tm ON t.id = tm.team_id
    WHERE tm.user_id = ?
  `;
  const params = [req.user.id];

  if (status === 'resolved') {
    query += ' AND r.is_resolved = 1';
  } else if (status === 'unresolved') {
    query += ' AND r.is_resolved = 0';
  }

  if (severity) {
    query += ' AND r.severity = ?';
    params.push(severity);
  }

  query += ' ORDER BY r.created_at DESC LIMIT ?';
  params.push(parseInt(limit));

  const reminders = db.prepare(query).all(...params);
  
  const stats = db.prepare(`
    SELECT 
      severity, 
      COUNT(*) as count
    FROM rotation_reminders
    WHERE is_resolved = 0
    GROUP BY severity
  `).all();

  res.json({ reminders, stats });
});

router.post('/reminders/:id/resolve', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { resolution_notes } = req.body;
  
  const db = getDb();
  const reminder = db.prepare('SELECT * FROM rotation_reminders WHERE id = ?').get(id);
  
  if (!reminder) {
    return res.status(404).json({ error: '提醒不存在' });
  }

  db.prepare(`
    UPDATE rotation_reminders
    SET is_resolved = 1, resolved_at = CURRENT_TIMESTAMP, resolved_by = ?
    WHERE id = ?
  `).run(req.user.id, id);

  logAction(req, 'resolve_reminder', 'reminder', id);
  res.json({ message: '已标记为已处理' });
});

router.get('/weak-passwords', authenticateToken, requireRole('admin'), (req, res) => {
  const db = getDb();
  const credentials = db.prepare(`
    SELECT c.id, c.title, c.username, c.encrypted_password,
      p.name as project_name, u.username as creator_name
    FROM credentials c
    JOIN projects p ON c.project_id = p.id
    JOIN users u ON c.created_by = u.id
    WHERE c.encrypted_password IS NOT NULL
      AND c.is_frozen = 0
  `).all();

  const weakPasswords = [];
  const { decrypt } = require('../utils/encryption');

  credentials.forEach(c => {
    try {
      const password = decrypt(c.encrypted_password, process.env.ENCRYPTION_KEY);
      const result = zxcvbn(password);
      
      if (result.score <= 2) {
        weakPasswords.push({
          id: c.id,
          title: c.title,
          project_name: c.project_name,
          creator_name: c.creator_name,
          score: result.score,
          suggestions: result.feedback.suggestions,
          warning: result.feedback.warning
        });
      }
    } catch (e) {
    }
  });

  res.json({ weak_passwords: weakPasswords });
});

function generateRandomToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let token = '';
  const crypto = require('crypto');
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    token += chars[bytes[i] % chars.length];
  }
  return token;
}

function generateStrongPassword(length = 20) {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = upper + lower + numbers + special;
  
  const crypto = require('crypto');
  const chars = [];
  chars.push(upper[crypto.randomInt(upper.length)]);
  chars.push(lower[crypto.randomInt(lower.length)]);
  chars.push(numbers[crypto.randomInt(numbers.length)]);
  chars.push(special[crypto.randomInt(special.length)]);
  
  for (let i = 4; i < length; i++) {
    chars.push(all[crypto.randomInt(all.length)]);
  }
  
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  
  return chars.join('');
}

router.post('/generate-value', authenticateToken, (req, res) => {
  const { type, length } = req.body;
  
  if (type === 'token') {
    const token = generateRandomToken(length || 32);
    res.json({ value: token, type: 'token' });
  } else if (type === 'password') {
    const password = generateStrongPassword(length || 20);
    res.json({ value: password, type: 'password' });
  } else {
    res.status(400).json({ error: '无效的类型' });
  }
  
  logAction(req, 'generate_secure_value', 'credential', null, { type, length });
});

router.get('/departed-users', authenticateToken, requireRole('admin'), (req, res) => {
  const db = getDb();
  
  const departedPermissions = db.prepare(`
    SELECT 
      u.id as user_id,
      u.username,
      u.email,
      u.department,
      COUNT(DISTINCT c.id) as credential_count,
      COUNT(DISTINCT ag.id) as grant_count,
      GROUP_CONCAT(DISTINCT c.title) as credentials
    FROM users u
    LEFT JOIN credentials c ON c.created_by = u.id
    LEFT JOIN access_grants ag ON ag.user_id = u.id
    WHERE u.status = 'inactive'
    GROUP BY u.id
    HAVING credential_count > 0 OR grant_count > 0
  `).all();

  res.json({ departed_users: departedPermissions });
});

router.post('/credentials/:id/rotate', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { new_password, new_token, new_certificate } = req.body;
  
  const db = getDb();
  const credential = db.prepare('SELECT * FROM credentials WHERE id = ?').get(id);
  
  if (!credential) {
    return res.status(404).json({ error: '凭据不存在' });
  }

  const { canAccessCredential, logAction } = require('../middleware/auth');
  if (!canAccessCredential(req.user.id, id)) {
    return res.status(403).json({ error: '无权轮换此凭据' });
  }

  const hasValue = (new_password && new_password.trim()) || 
                   (new_token && new_token.trim()) || 
                   (new_certificate && new_certificate.trim());
  
  if (!hasValue) {
    return res.status(400).json({ error: '请输入新的密码、Token或证书' });
  }

  const { encrypt } = require('../utils/encryption');
  const updates = [];
  const params = [];

  if (new_password && new_password.trim()) {
    updates.push('encrypted_password = ?');
    params.push(encrypt(new_password.trim(), process.env.ENCRYPTION_KEY));
  }
  if (new_token && new_token.trim()) {
    updates.push('encrypted_token = ?');
    params.push(encrypt(new_token.trim(), process.env.ENCRYPTION_KEY));
  }
  if (new_certificate && new_certificate.trim()) {
    updates.push('encrypted_certificate = ?');
    params.push(encrypt(new_certificate.trim(), process.env.ENCRYPTION_KEY));
  }

  updates.push('last_rotated_at = CURRENT_TIMESTAMP');
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  db.prepare(`UPDATE credentials SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  db.prepare(`
    UPDATE rotation_reminders 
    SET is_resolved = 1, resolved_at = CURRENT_TIMESTAMP, resolved_by = ?
    WHERE credential_id = ? AND is_resolved = 0
  `).run(req.user.id, id);

  logAction(req, 'rotate_credential', 'credential', id);
  res.json({ message: '凭据轮换成功' });
});

router.get('/stats', authenticateToken, (req, res) => {
  const db = getDb();
  
  const totalCredentials = db.prepare(`
    SELECT COUNT(*) as count FROM credentials c
    JOIN projects p ON c.project_id = p.id
    JOIN teams t ON p.team_id = t.id
    JOIN team_members tm ON t.id = tm.team_id
    WHERE tm.user_id = ?
  `).get(req.user.id);

  const frozenCredentials = db.prepare(`
    SELECT COUNT(*) as count FROM credentials c
    JOIN projects p ON c.project_id = p.id
    JOIN teams t ON p.team_id = t.id
    JOIN team_members tm ON t.id = tm.team_id
    WHERE tm.user_id = ? AND c.is_frozen = 1
  `).get(req.user.id);

  generateReminders();
  
  const pendingReminders = db.prepare(`
    SELECT COUNT(*) as count FROM rotation_reminders r
    JOIN credentials c ON r.credential_id = c.id
    JOIN projects p ON c.project_id = p.id
    JOIN teams t ON p.team_id = t.id
    JOIN team_members tm ON t.id = tm.team_id
    WHERE tm.user_id = ? AND r.is_resolved = 0
  `).get(req.user.id);

  const recentViews = db.prepare(`
    SELECT COUNT(*) as count FROM credential_views cv
    JOIN credentials c ON cv.credential_id = c.id
    JOIN projects p ON c.project_id = p.id
    JOIN teams t ON p.team_id = t.id
    JOIN team_members tm ON t.id = tm.team_id
    WHERE tm.user_id = ? AND cv.created_at > datetime('now', '-7 days')
  `).get(req.user.id);

  res.json({
    total_credentials: totalCredentials.count,
    frozen_credentials: frozenCredentials.count,
    pending_reminders: pendingReminders.count,
    recent_views: recentViews.count
  });
});

module.exports = router;
