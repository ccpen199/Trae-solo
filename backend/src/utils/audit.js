const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');

function createAuditLog({
  actionType,
  entityType,
  entityId,
  operatorId,
  operatorName,
  reason = '',
  oldValue = null,
  newValue = null,
  affectedObjects = '',
  recoveryPath = ''
}) {
  const stmt = db.prepare(`
    INSERT INTO audit_logs (
      id, action_type, entity_type, entity_id, operator_id, operator_name,
      reason, old_value, new_value, affected_objects, recovery_path, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  stmt.run(
    uuidv4(),
    actionType,
    entityType,
    entityId,
    operatorId,
    operatorName,
    reason,
    oldValue ? JSON.stringify(oldValue) : null,
    newValue ? JSON.stringify(newValue) : null,
    affectedObjects,
    recoveryPath
  );
}

module.exports = { createAuditLog };
