const db = require('../db');

const auditLog = (action, targetType = null, targetId = null, detail = null) => {
  return (req, res, next) => {
    const operatorId = req.user?.id || null;
    const operatorRole = req.user?.role || null;
    const ip = req.ip || req.connection.remoteAddress;

    db.prepare(`
      INSERT INTO audit_logs (operator_id, operator_role, action, target_type, target_id, detail, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(operatorId, operatorRole, action, targetType, targetId, detail, ip);

    next();
  };
};

const logAction = (action, req, targetType = null, targetId = null, detail = null) => {
  const operatorId = req.user?.id || null;
  const operatorRole = req.user?.role || null;
  const ip = req.ip || req.connection.remoteAddress;

  db.prepare(`
    INSERT INTO audit_logs (operator_id, operator_role, action, target_type, target_id, detail, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(operatorId, operatorRole, action, targetType, targetId, detail, ip);
};

module.exports = { auditLog, logAction };
