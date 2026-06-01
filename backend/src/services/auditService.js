const db = require('../models/database');

class AuditService {
  async logAction(action, entityType, entityId, operatorId, reason, oldValues, newValues, affectedObjects, recoveryPath) {
    const changeSummary = this.generateChangeSummary(oldValues, newValues);
    
    await db.run(
      'INSERT INTO audit_logs (action, entity_type, entity_id, operator_id, reason, change_summary, old_values, new_values, affected_objects, recovery_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        action,
        entityType,
        entityId,
        operatorId,
        reason,
        changeSummary,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        affectedObjects ? JSON.stringify(affectedObjects) : null,
        recoveryPath
      ]
    );
  }

  generateChangeSummary(oldValues, newValues) {
    if (!oldValues || !newValues) return null;
    
    const changes = [];
    for (const key of Object.keys(newValues)) {
      if (oldValues[key] !== newValues[key]) {
        changes.push(`${key}: ${oldValues[key]} -> ${newValues[key]}`);
      }
    }
    return changes.join('; ');
  }

  async getLogs(entityType, entityId, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    let sql = 'SELECT a.*, u.name as operator_name FROM audit_logs a JOIN users u ON a.operator_id = u.id';
    const params = [];
    
    if (entityType) {
      sql += ' WHERE a.entity_type = ?';
      params.push(entityType);
      if (entityId) {
        sql += ' AND a.entity_id = ?';
        params.push(entityId);
      }
    }
    
    sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);
    
    return await db.all(sql, params);
  }
}

module.exports = new AuditService();
