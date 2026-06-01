const jwt = require('jsonwebtoken');
const { getDb } = require('../database/schema');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDb();
    const dbUser = db.prepare('SELECT id, username, email, role, department, status FROM users WHERE id = ?').get(user.id);
    
    if (!dbUser || dbUser.status !== 'active') {
      return res.status(403).json({ error: '用户不存在或已被禁用' });
    }
    
    req.user = dbUser;
    next();
  } catch (err) {
    return res.status(403).json({ error: '无效的认证令牌' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}

function canAccessCredential(userId, credentialId) {
  const db = getDb();
  
  const credential = db.prepare(`
    SELECT c.id, c.project_id, c.created_by, p.team_id
    FROM credentials c
    JOIN projects p ON c.project_id = p.id
    WHERE c.id = ?
  `).get(credentialId);

  if (!credential) return false;

  const isOwner = credential.created_by === userId;
  if (isOwner) return true;

  const hasGrant = db.prepare(`
    SELECT 1 FROM access_grants
    WHERE credential_id = ? AND user_id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
  `).get(credentialId, userId);
  if (hasGrant) return true;

  const hasTeamMember = db.prepare(`
    SELECT 1 FROM team_members tm
    JOIN projects p ON p.team_id = tm.team_id
    WHERE p.id = ? AND tm.user_id = ?
  `).get(credential.project_id, userId);

  return !!hasTeamMember;
}

function logAction(req, action, resourceType, resourceId, details = {}) {
  const db = getDb();
  db.prepare(`
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, details)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user?.id,
    action,
    resourceType,
    resourceId,
    req.ip,
    req.headers['user-agent'],
    JSON.stringify(details)
  );
}

module.exports = { authenticateToken, requireRole, canAccessCredential, logAction };
