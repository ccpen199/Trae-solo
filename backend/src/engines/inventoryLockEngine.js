const { get, all, run } = require('../config/database');

class InventoryLockEngine {
  static lockResource(resourceType, resourceId, holderId, reason, expiresInMinutes = 30) {
    return new Promise((resolve, reject) => {
      try {
        const existingLock = get(
          'SELECT * FROM inventory_locks WHERE resource_type = ? AND resource_id = ? AND is_active = 1',
          [resourceType, resourceId]
        );
        
        if (existingLock) {
          if (existingLock.lock_holder_id === holderId) {
            resolve(existingLock);
            return;
          }
          reject(new Error('资源已被其他用户锁定'));
          return;
        }
        
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);
        
        const result = run(
          `INSERT INTO inventory_locks 
           (resource_type, resource_id, lock_holder_id, lock_reason, locked_at, expires_at, is_active)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 1)`,
          [resourceType, resourceId, holderId, reason, expiresAt.toISOString()]
        );
        
        resolve({
          id: result.lastInsertRowid,
          resourceType,
          resourceId,
          holderId,
          reason,
          expiresAt
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  static releaseResource(resourceType, resourceId, holderId) {
    return new Promise((resolve, reject) => {
      try {
        const result = run(
          'UPDATE inventory_locks SET is_active = 0 WHERE resource_type = ? AND resource_id = ? AND lock_holder_id = ? AND is_active = 1',
          [resourceType, resourceId, holderId]
        );
        
        if (result.changes === 0) {
          resolve(null);
          return;
        }
        resolve({ released: true });
      } catch (err) {
        reject(err);
      }
    });
  }

  static isResourceLocked(resourceType, resourceId) {
    return new Promise((resolve, reject) => {
      try {
        const lock = get(
          `SELECT * FROM inventory_locks 
           WHERE resource_type = ? AND resource_id = ? AND is_active = 1 AND expires_at > CURRENT_TIMESTAMP`,
          [resourceType, resourceId]
        );
        resolve(lock ? lock : null);
      } catch (err) {
        reject(err);
      }
    });
  }

  static checkAndExpireLocks() {
    return new Promise((resolve, reject) => {
      try {
        const result = run(
          'UPDATE inventory_locks SET is_active = 0 WHERE is_active = 1 AND expires_at < CURRENT_TIMESTAMP'
        );
        resolve({ expiredCount: result.changes });
      } catch (err) {
        reject(err);
      }
    });
  }

  static lockTemplate(templateId, holderId) {
    return this.lockResource('template', templateId, holderId, '模板编辑锁定', 60);
  }

  static releaseTemplate(templateId, holderId) {
    return this.releaseResource('template', templateId, holderId);
  }
}

module.exports = InventoryLockEngine;
