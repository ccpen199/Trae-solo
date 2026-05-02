const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const MODULES = {
  PRODUCT: 'product',
  ORDER: 'order',
  CHAT: 'chat',
  PAYMENT: 'payment',
  USER: 'user',
  APPRAISAL: 'appraisal',
  DISPUTE: 'dispute',
  SYSTEM: 'system'
};

const ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  QUERY: 'query',
  STATUS_CHANGE: 'status_change'
};

class AuditService {
  constructor() {
    this.insertStmt = db.prepare(`
      INSERT INTO audit_logs (
        trace_id, user_id, username, role, module, action,
        resource_type, resource_id, old_value, new_value,
        description, ip_address, user_agent, request_path,
        request_method, status, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
  }

  log(options) {
    const {
      user = null,
      module,
      action,
      resourceType = null,
      resourceId = null,
      oldValue = null,
      newValue = null,
      description = null,
      ip = null,
      userAgent = null,
      requestPath = null,
      requestMethod = null,
      status = 'success',
      errorMessage = null
    } = options;

    const traceId = uuidv4();
    const userId = user ? user.id : null;
    const username = user ? user.username : null;
    const role = user ? user.role : null;

    try {
      this.insertStmt.run(
        traceId,
        userId,
        username,
        role,
        module,
        action,
        resourceType,
        String(resourceId),
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        description,
        ip,
        userAgent,
        requestPath,
        requestMethod,
        status,
        errorMessage
      );
    } catch (error) {
      console.error('审计日志记录失败:', error);
    }

    return traceId;
  }

  logCreate(options) {
    return this.log({ ...options, action: ACTIONS.CREATE });
  }

  logUpdate(options) {
    return this.log({ ...options, action: ACTIONS.UPDATE });
  }

  logDelete(options) {
    return this.log({ ...options, action: ACTIONS.DELETE });
  }

  logStatusChange(options) {
    return this.log({ ...options, action: ACTIONS.STATUS_CHANGE });
  }

  logQuery(options) {
    return this.log({ ...options, action: ACTIONS.QUERY });
  }

  getLogsByResource(resourceType, resourceId, options = {}) {
    const { limit = 100, offset = 0 } = options;
    
    return db.prepare(`
      SELECT * FROM audit_logs 
      WHERE resource_type = ? AND resource_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(resourceType, String(resourceId), limit, offset);
  }

  getLogsByUser(userId, options = {}) {
    const { limit = 100, offset = 0, module = null, action = null } = options;
    
    let sql = `SELECT * FROM audit_logs WHERE user_id = ?`;
    const params = [userId];

    if (module) {
      sql += ` AND module = ?`;
      params.push(module);
    }
    if (action) {
      sql += ` AND action = ?`;
      params.push(action);
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return db.prepare(sql).all(...params);
  }

  getLogsByTraceId(traceId) {
    return db.prepare(`
      SELECT * FROM audit_logs WHERE trace_id = ? ORDER BY created_at ASC
    `).all(traceId);
  }

  searchLogs(options = {}) {
    const {
      keyword = null,
      module = null,
      action = null,
      userId = null,
      status = null,
      startDate = null,
      endDate = null,
      limit = 100,
      offset = 0
    } = options;

    let sql = `SELECT * FROM audit_logs WHERE 1=1`;
    const params = [];

    if (keyword) {
      sql += ` AND (description LIKE ? OR username LIKE ? OR resource_id LIKE ?)`;
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
    }

    if (module) {
      sql += ` AND module = ?`;
      params.push(module);
    }

    if (action) {
      sql += ` AND action = ?`;
      params.push(action);
    }

    if (userId) {
      sql += ` AND user_id = ?`;
      params.push(userId);
    }

    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    if (startDate) {
      sql += ` AND created_at >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND created_at <= ?`;
      params.push(endDate);
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return db.prepare(sql).all(...params);
  }
}

module.exports = new AuditService();
module.exports.MODULES = MODULES;
module.exports.ACTIONS = ACTIONS;
