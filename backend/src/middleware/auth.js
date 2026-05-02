const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.get(
      `SELECT u.*, r.code as role_code, r.name as role_name 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [decoded.userId]
    );

    if (!user || user.status !== 1) {
      return res.status(401).json({ error: '用户不存在或已禁用' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: '令牌无效或已过期' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    if (allowedRoles.includes('ADMIN') && req.user.role_code === 'ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role_code)) {
      return res.status(403).json({ error: '权限不足' });
    }

    next();
  };
}

const ROLE_PERMISSION_MAP = {
  MERCHANT: ['COLLECTION_CREATE', 'COLLECTION_VIEW', 'COLLECTION_EDIT', 'SETTLEMENT_VIEW', 'REPORT_VIEW'],
  MERCHANT_ADMIN: ['MERCHANT_VIEW', 'MERCHANT_EDIT', 'COLLECTION_CREATE', 'COLLECTION_VIEW', 'COLLECTION_EDIT', 'SETTLEMENT_VIEW', 'REPORT_VIEW', 'REPORT_EXPORT'],
  BUYER: ['PAYMENT_VIEW'],
  PAYMENT_INSTITUTION: ['PAYMENT_PROCESS', 'PAYMENT_VIEW'],
  BANK: ['SETTLEMENT_PROCESS', 'SETTLEMENT_VIEW', 'RECONCILIATION_PROCESS'],
  COMPLIANCE: ['KYC_REVIEW', 'COMPLIANCE_AUDIT', 'COLLECTION_VIEW', 'PAYMENT_VIEW', 'AUDIT_VIEW'],
  FINANCE: ['SETTLEMENT_PROCESS', 'SETTLEMENT_VIEW', 'RECONCILIATION_PROCESS', 'REPORT_VIEW', 'REPORT_EXPORT'],
  ADMIN: ['MERCHANT_VIEW', 'MERCHANT_EDIT', 'COLLECTION_CREATE', 'COLLECTION_VIEW', 'COLLECTION_EDIT',
          'PAYMENT_PROCESS', 'PAYMENT_VIEW', 'KYC_REVIEW', 'COMPLIANCE_AUDIT',
          'SETTLEMENT_PROCESS', 'SETTLEMENT_VIEW', 'RECONCILIATION_PROCESS',
          'REPORT_VIEW', 'REPORT_EXPORT', 'AUDIT_VIEW', 'USER_MANAGE', 'ROLE_MANAGE', 'RATE_MANAGE'],
};

function requirePermission(permissionCode) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    if (req.user.role_code === 'ADMIN') {
      return next();
    }

    const rolePerms = ROLE_PERMISSION_MAP[req.user.role_code] || [];
    if (rolePerms.includes(permissionCode)) {
      return next();
    }

    const hasPermission = db.get(
      `SELECT 1 
       FROM role_permissions rp 
       JOIN permissions p ON rp.permission_id = p.id 
       WHERE rp.role_id = ? AND p.code = ?`,
      [req.user.role_id, permissionCode]
    );

    if (!hasPermission) {
      return res.status(403).json({ error: '权限不足' });
    }

    next();
  };
}

function generateToken(userId) {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission,
  generateToken,
  JWT_SECRET,
};
