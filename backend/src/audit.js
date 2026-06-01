const { db } = require('./database');
const { v4: uuidv4 } = require('uuid');

function createAuditLog({
  interviewId,
  actionType,
  objectType,
  objectId,
  actor,
  changeReason,
  affectedFields,
  oldValues,
  newValues,
  recoveryPath
}) {
  const stmt = db.prepare(`
    INSERT INTO audit_logs (
      id, interview_id, action_type, object_type, object_id,
      actor_id, actor_name, change_reason, affected_fields,
      old_values, new_values, recovery_path
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    uuidv4(),
    interviewId,
    actionType,
    objectType,
    objectId,
    actor?.id,
    actor?.name,
    changeReason,
    affectedFields ? JSON.stringify(affectedFields) : null,
    oldValues ? JSON.stringify(oldValues) : null,
    newValues ? JSON.stringify(newValues) : null,
    recoveryPath
  );
}

function getAuditLogs(interviewId, limit = 50) {
  let stmt;
  if (interviewId) {
    stmt = db.prepare(`
      SELECT * FROM audit_logs 
      WHERE interview_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(interviewId, limit);
  } else {
    stmt = db.prepare(`
      SELECT * FROM audit_logs 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(limit);
  }
}

module.exports = { createAuditLog, getAuditLogs };
