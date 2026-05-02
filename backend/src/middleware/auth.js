const jwt = require('jsonwebtoken');
const db = require('../database/init');

const JWT_SECRET = process.env.JWT_SECRET || 'legal-case-management-secret-key-2024';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: '令牌无效或已过期' });
  }
};

const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }

    next();
  };
};

const caseAccessMiddleware = (req, res, next) => {
  const caseId = req.params.caseId || req.body.caseId;
  const user = req.user;

  if (!caseId) {
    return next();
  }

  db.get(
    'SELECT * FROM cases WHERE id = ?',
    [caseId],
    (err, caseData) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      if (!caseData) {
        return res.status(404).json({ error: '案件不存在' });
      }

      let hasAccess = false;

      switch (user.role) {
        case 'lead_lawyer':
          hasAccess = caseData.lead_lawyer_id === user.id;
          break;
        case 'assistant':
          hasAccess = caseData.assistant_id === user.id || caseData.lead_lawyer_id === user.id;
          break;
        case 'client':
          hasAccess = caseData.client_id === user.id;
          break;
        case 'finance':
          hasAccess = true;
          break;
        default:
          hasAccess = false;
      }

      if (!hasAccess) {
        return res.status(403).json({ error: '无权访问此案件' });
      }

      req.caseData = caseData;
      next();
    }
  );
};

module.exports = {
  authMiddleware,
  roleMiddleware,
  caseAccessMiddleware,
  JWT_SECRET
};
