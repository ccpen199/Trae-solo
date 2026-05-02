const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const insertAuditLogStmt = db.prepare(`
  INSERT INTO audit_logs (id, entity_type, entity_id, action, actor_id, actor_role, details, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

const getAuditLogsByEntityStmt = db.prepare(`
  SELECT * FROM audit_logs 
  WHERE entity_type = ? AND entity_id = ? 
  ORDER BY created_at DESC
`);

const getAuditLogsByActorStmt = db.prepare(`
  SELECT * FROM audit_logs 
  WHERE actor_id = ? 
  ORDER BY created_at DESC
  LIMIT 100
`);

class AuditService {
  static log(entityType, entityId, action, actorId, actorRole, details = {}, status = 'success') {
    try {
      const id = uuidv4();
      const detailsJson = JSON.stringify(details);
      insertAuditLogStmt.run(id, entityType, entityId, action, actorId, actorRole, detailsJson, status);
      console.log(`[AUDIT] ${action} on ${entityType}:${entityId} by ${actorRole}:${actorId}`);
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  }

  static getByEntity(entityType, entityId) {
    return getAuditLogsByEntityStmt.all(entityType, entityId).map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : {}
    }));
  }

  static getByActor(actorId) {
    return getAuditLogsByActorStmt.all(actorId).map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : {}
    }));
  }
}

module.exports = AuditService;
