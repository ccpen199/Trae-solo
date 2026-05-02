const { getDb } = require('../database/init');
const { generateId, stringifyJSON } = require('../utils/common');

const db = getDb();

const createAuditLog = (options) => {
  const {
    operatorId,
    operatorType = 'employee',
    module,
    action,
    targetType,
    targetId,
    oldValue,
    newValue,
    ipAddress,
    userAgent,
    remark,
  } = options;

  const id = generateId();
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO audit_logs (
      id, operator_id, operator_type, module, action,
      target_type, target_id, old_value, new_value,
      ip_address, user_agent, remark, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, operatorId, operatorType, module, action,
    targetType, targetId,
    stringifyJSON(oldValue), stringifyJSON(newValue),
    ipAddress, userAgent, remark, createdAt
  );

  return { id, ...options, createdAt };
};

const getAuditLogs = (options = {}) => {
  const { module, action, operatorId, targetType, targetId, limit = 100, offset = 0 } = options;
  let sql = `
    SELECT a.*,
           m.name as operator_name, m.avatar as operator_avatar
    FROM audit_logs a
    LEFT JOIN employees m ON a.operator_id = m.id
    WHERE 1=1
  `;
  const params = [];

  if (module) {
    sql += ' AND a.module = ?';
    params.push(module);
  }

  if (action) {
    sql += ' AND a.action = ?';
    params.push(action);
  }

  if (operatorId) {
    sql += ' AND a.operator_id = ?';
    params.push(operatorId);
  }

  if (targetType) {
    sql += ' AND a.target_type = ?';
    params.push(targetType);
  }

  if (targetId) {
    sql += ' AND a.target_id = ?';
    params.push(targetId);
  }

  sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(sql).all(...params);
};

module.exports = {
  createAuditLog,
  getAuditLogs,
};
