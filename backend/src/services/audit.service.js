const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const AuditService = {
  log: (operatorId, operatorName, module, action, targetType, targetId, beforeValue, afterValue, ip = '') => {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (
        id, operator_id, operator_name, module, action, target_type, 
        target_id, before_value, after_value, ip_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(
      uuidv4(), 
      operatorId, 
      operatorName, 
      module, 
      action, 
      targetType, 
      targetId,
      JSON.stringify(beforeValue),
      JSON.stringify(afterValue),
      ip
    );
  },

  getLogs: (filters = {}) => {
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    
    if (filters.operatorId) {
      sql += ' AND operator_id = ?';
      params.push(filters.operatorId);
    }
    if (filters.module) {
      sql += ' AND module = ?';
      params.push(filters.module);
    }
    if (filters.action) {
      sql += ' AND action = ?';
      params.push(filters.action);
    }
    if (filters.startDate) {
      sql += ' AND date(created_at) >= date(?)';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      sql += ' AND date(created_at) <= date(?)';
      params.push(filters.endDate);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }
    
    return db.prepare(sql).all(...params);
  }
};

module.exports = AuditService;
