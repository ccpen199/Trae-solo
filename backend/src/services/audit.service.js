const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { AuditAction } = require('../config/enums');

class AuditService {
  static hashRecord(userId, action, objectType, objectId, timestamp) {
    const data = `${userId}-${action}-${objectType}-${objectId}-${timestamp}`;
    return crypto.createHash('sha256').update(data + process.env.JWT_SECRET).digest('hex');
  }

  static log(req, action, module, objectType, objectId, oldValue = null, newValue = null, changeReason = null) {
    const id = uuidv4();
    const now = new Date().toISOString();
    const userId = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.role : null;
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const hashValue = this.hashRecord(userId, action, objectType, objectId, now);
    
    const stmt = db.prepare(`
      INSERT INTO audit_logs (
        id, user_id, user_role, action, module, object_type, object_id,
        old_value, new_value, change_reason, ip_address, user_agent, hash_value
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    try {
      stmt.run(
        id, userId, userRole, action, module, objectType, objectId,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        changeReason, ipAddress, userAgent, hashValue
      );
    } catch (err) {
      console.error('Audit log error:', err);
    }
    
    return id;
  }

  static logCreate(req, module, objectType, objectId, newValue, reason = null) {
    return this.log(req, AuditAction.CREATE, module, objectType, objectId, null, newValue, reason);
  }

  static logUpdate(req, module, objectType, objectId, oldValue, newValue, reason = null) {
    return this.log(req, AuditAction.UPDATE, module, objectType, objectId, oldValue, newValue, reason);
  }

  static logDelete(req, module, objectType, objectId, oldValue, reason = null) {
    return this.log(req, AuditAction.DELETE, module, objectType, objectId, oldValue, null, reason);
  }

  static logDispatch(req, module, objectType, objectId, oldValue, newValue, reason = null) {
    return this.log(req, AuditAction.DISPATCH, module, objectType, objectId, oldValue, newValue, reason);
  }

  static logAccept(req, module, objectType, objectId, oldValue, newValue) {
    return this.log(req, AuditAction.ACCEPT, module, objectType, objectId, oldValue, newValue);
  }

  static logComplete(req, module, objectType, objectId, oldValue, newValue) {
    return this.log(req, AuditAction.COMPLETE, module, objectType, objectId, oldValue, newValue);
  }

  static logVerify(req, module, objectType, objectId, oldValue, newValue) {
    return this.log(req, AuditAction.VERIFY, module, objectType, objectId, oldValue, newValue);
  }

  static logSettle(req, objectId, newValue) {
    return this.log(req, AuditAction.SETTLE, 'settlement', 'daily_settlement', objectId, null, newValue);
  }

  static logGenerateReport(req, objectId, newValue) {
    return this.log(req, AuditAction.GENERATE_REPORT, 'asset', 'valuation', objectId, null, newValue);
  }

  static getObjectHistory(objectType, objectId, limit = 100) {
    return db.prepare(`
      SELECT 
        id, user_id, user_role, action, module, old_value, new_value,
        change_reason, ip_address, hash_value, created_at
      FROM audit_logs 
      WHERE object_type = ? AND object_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(objectType, objectId, limit);
  }

  static verifyChain(objectType, objectId) {
    const logs = db.prepare(`
      SELECT id, hash_value, created_at 
      FROM audit_logs 
      WHERE object_type = ? AND object_id = ?
      ORDER BY created_at ASC
    `).all(objectType, objectId);

    for (const log of logs) {
      const expectedHash = this.hashRecord(
        log.user_id, log.action, objectType, objectId, log.created_at
      );
      if (log.hash_value !== expectedHash) {
        return { valid: false, invalidAt: log.id };
      }
    }
    return { valid: true, count: logs.length };
  }
}

module.exports = AuditService;
