const crypto = require('crypto');
const db = require('./database');

const SESSIONS = new Map();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'may-89086-salt').digest('hex');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function getSession(token) {
  if (!token) return null;
  const session = SESSIONS.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    SESSIONS.delete(token);
    return null;
  }
  return session;
}

function createSession(user) {
  const token = generateToken();
  const session = {
    token,
    userId: user.id,
    username: user.username,
    userType: user.user_type,
    realName: user.real_name,
    roles: [],
    permissions: [],
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000
  };
  
  const userRoles = db.query(`
    SELECT r.* FROM roles r
    INNER JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = ?
  `, [user.id]);
  session.roles = userRoles.map(r => r.code);
  
  if (userRoles.length > 0) {
    const roleIds = userRoles.map(r => r.id).join(',');
    const permissions = db.query(`
      SELECT DISTINCT p.code FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id IN (${roleIds})
    `);
    session.permissions = permissions.map(p => p.code);
  }
  
  SESSIONS.set(token, session);
  return session;
}

function destroySession(token) {
  return SESSIONS.delete(token);
}

function hasRole(session, roleCode) {
  if (!session) return false;
  return session.roles.includes(roleCode) || session.roles.includes('system_admin');
}

function hasPermission(session, permissionCode) {
  if (!session) return false;
  if (session.roles.includes('system_admin')) return true;
  return session.permissions.includes(permissionCode);
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const session = getSession(token);
  
  if (!session) {
    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, message: '未登录或登录已过期' }));
    return;
  }
  
  req.session = session;
  next();
}

function requireRole(roleCode) {
  return (req, res, next) => {
    if (!hasRole(req.session, roleCode)) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, message: '权限不足' }));
      return;
    }
    next();
  };
}

function requirePermission(permissionCode) {
  return (req, res, next) => {
    if (!hasPermission(req.session, permissionCode)) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, message: '权限不足' }));
      return;
    }
    next();
  };
}

module.exports = {
  hashPassword,
  verifyPassword,
  createSession,
  getSession,
  destroySession,
  hasRole,
  hasPermission,
  requireAuth,
  requireRole,
  requirePermission
};
