const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'alert_monitoring_jwt_secret_key_2024';
const JWT_EXPIRES_IN = '24h';

const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    name: user.name,
    iat: Date.now()
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const getUserFromToken = async (token) => {
  const decoded = verifyToken(token);
  if (!decoded) return null;
  
  const users = query(
    'SELECT * FROM users WHERE id = ? AND status = 1',
    [decoded.id]
  );
  
  if (users.length === 0) return null;
  
  const user = users[0];
  const roles = query(
    `SELECT r.id, r.code, r.name FROM roles r
     INNER JOIN user_roles ur ON r.id = ur.role_id
     WHERE ur.user_id = ?`,
    [user.id]
  );
  
  const permissions = query(
    `SELECT DISTINCT p.code FROM permissions p
     INNER JOIN role_permissions rp ON p.id = rp.permission_id
     INNER JOIN user_roles ur ON rp.role_id = ur.role_id
     WHERE ur.user_id = ?`,
    [user.id]
  );
  
  return {
    ...user,
    roles: roles.map(r => r.code),
    permissions: permissions.map(p => p.code)
  };
};

const checkPermission = (user, permissionCode) => {
  if (!user || !user.permissions) return false;
  if (user.roles && user.roles.includes('admin')) return true;
  return user.permissions.includes(permissionCode);
};

const hasRole = (user, roleCode) => {
  if (!user || !user.roles) return false;
  if (user.roles.includes('admin')) return true;
  return user.roles.includes(roleCode);
};

module.exports = {
  generateToken,
  verifyToken,
  getUserFromToken,
  checkPermission,
  hasRole
};
