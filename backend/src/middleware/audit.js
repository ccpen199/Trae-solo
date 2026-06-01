const db = require('../config/database');

const logAudit = (tableName, recordId, action, oldData, newData, operator = 'system') => {
  const stmt = db.prepare(`
    INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, operator, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    tableName,
    recordId,
    action,
    oldData ? JSON.stringify(oldData) : null,
    newData ? JSON.stringify(newData) : null,
    operator,
    '127.0.0.1'
  );
};

const auditMiddleware = (tableName) => {
  return (req, res, next) => {
    req.audit = (recordId, action, oldData, newData) => {
      logAudit(tableName, recordId, action, oldData, newData, req.headers['x-operator'] || 'system');
    };
    next();
  };
};

module.exports = { logAudit, auditMiddleware };
