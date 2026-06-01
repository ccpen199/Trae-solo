const db = require('../database');

function auditLog(action, entityType, entityId, details, operator = 'system') {
  const stmt = db.prepare(`
    INSERT INTO audit_logs (action, entity_type, entity_id, details, operator, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(action, entityType, entityId, JSON.stringify(details), operator, '127.0.0.1');
}

function auditMiddleware(req, res, next) {
  req.audit = (action, entityType, entityId, details) => {
    auditLog(action, entityType, entityId, details, req.headers['x-operator'] || 'admin');
  };
  next();
}

module.exports = { auditLog, auditMiddleware };
