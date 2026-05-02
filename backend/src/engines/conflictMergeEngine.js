const { db } = require('../database');
const _ = require('lodash');

class ConflictMergeEngine {
  constructor() {
    this.mergeStrategies = {
      'last_write_wins': this.lastWriteWins.bind(this),
      'first_write_wins': this.firstWriteWins.bind(this),
      'manual_merge': this.manualMerge.bind(this),
      'smart_merge': this.smartMerge.bind(this)
    };
  }

  detectConflict(documentId, userId, newContent, currentVersion) {
    const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);
    if (!document) {
      return { hasConflict: false };
    }

    const latestVersion = db.prepare(`
      SELECT * FROM versions 
      WHERE document_id = ? 
      ORDER BY version_no DESC 
      LIMIT 1
    `).get(documentId);

    if (latestVersion && latestVersion.version_no > currentVersion) {
      return {
        hasConflict: true,
        conflictType: 'version_conflict',
        currentVersion,
        latestVersion: latestVersion.version_no,
        originalContent: latestVersion.content,
        conflictingContent: newContent,
        document,
        userId
      };
    }

    const editSessions = db.prepare(`
      SELECT * FROM conflict_records 
      WHERE document_id = ? AND is_resolved = 0
    `).all(documentId);

    if (editSessions.length > 0) {
      return {
        hasConflict: true,
        conflictType: 'concurrent_edit',
        activeSessions: editSessions,
        document,
        userId
      };
    }

    return { hasConflict: false };
  }

  recordConflict(conflictInfo) {
    const result = db.prepare(`
      INSERT INTO conflict_records 
      (document_id, version_no, conflict_type, user_id, original_content, conflicting_content)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      conflictInfo.document.id,
      conflictInfo.document.version,
      conflictInfo.conflictType,
      conflictInfo.userId,
      conflictInfo.originalContent || conflictInfo.document.content,
      conflictInfo.conflictingContent
    );

    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(conflictInfo.userId);
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id, details)
      VALUES (?, ?, 'conflict_recorded', 'document', ?, ?)
    `).run(
      conflictInfo.userId,
      user?.name,
      conflictInfo.document.id,
      JSON.stringify({
        conflictType: conflictInfo.conflictType,
        currentVersion: conflictInfo.currentVersion,
        latestVersion: conflictInfo.latestVersion
      })
    );

    return { conflictId: result.lastInsertRowid };
  }

  resolveConflict(conflictId, resolutionStrategy, resolvedContent, resolverId) {
    const conflict = db.prepare('SELECT * FROM conflict_records WHERE id = ?').get(conflictId);
    if (!conflict) {
      return { success: false, error: '冲突记录不存在' };
    }

    const strategy = this.mergeStrategies[resolutionStrategy] || this.mergeStrategies['last_write_wins'];
    const result = strategy(conflict, resolvedContent);

    if (result.success) {
      db.prepare(`
        UPDATE conflict_records 
        SET is_resolved = 1, resolved_content = ?, resolved_by = ?
        WHERE id = ?
      `).run(JSON.stringify(result.resolvedContent), resolverId, conflictId);

      const user = db.prepare('SELECT name FROM users WHERE id = ?').get(resolverId);
      db.prepare(`
        INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id, details)
        VALUES (?, ?, 'conflict_resolved', 'document', ?, ?)
      `).run(
        resolverId,
        user?.name,
        conflict.document_id,
        JSON.stringify({
          conflictId,
          strategy: resolutionStrategy
        })
      );
    }

    return result;
  }

  lastWriteWins(conflict, resolvedContent) {
    return {
      success: true,
      resolvedContent: resolvedContent || conflict.conflicting_content,
      strategy: 'last_write_wins'
    };
  }

  firstWriteWins(conflict) {
    return {
      success: true,
      resolvedContent: conflict.original_content,
      strategy: 'first_write_wins'
    };
  }

  manualMerge(conflict, resolvedContent) {
    if (!resolvedContent) {
      return { success: false, error: '手动合并需要提供解决后的内容' };
    }
    return {
      success: true,
      resolvedContent,
      strategy: 'manual_merge'
    };
  }

  smartMerge(conflict) {
    let original = conflict.original_content || '';
    let conflicting = conflict.conflicting_content || '';

    if (typeof original === 'string') {
      try {
        original = JSON.parse(original);
      } catch { original = { text: original }; }
    }
    if (typeof conflicting === 'string') {
      try {
        conflicting = JSON.parse(conflicting);
      } catch { conflicting = { text: conflicting }; }
    }

    const merged = _.merge({}, original, conflicting);

    return {
      success: true,
      resolvedContent: merged,
      strategy: 'smart_merge',
      conflicts: this.findMergeConflicts(original, conflicting)
    };
  }

  findMergeConflicts(original, conflicting) {
    const conflicts = [];
    const allKeys = new Set([...Object.keys(original || {}), ...Object.keys(conflicting || {})]);

    allKeys.forEach(key => {
      const origVal = original?.[key];
      const confVal = conflicting?.[key];
      if (origVal !== undefined && confVal !== undefined && origVal !== confVal) {
        if (typeof origVal === 'object' && typeof confVal === 'object') {
          const nestedConflicts = this.findMergeConflicts(origVal, confVal);
          if (nestedConflicts.length > 0) {
            conflicts.push({ field: key, conflicts: nestedConflicts });
          }
        } else {
          conflicts.push({
            field: key,
            original: origVal,
            conflicting: confVal
          });
        }
      }
    });

    return conflicts;
  }

  getActiveConflicts(documentId) {
    return db.prepare(`
      SELECT cr.*, u.name as user_name
      FROM conflict_records cr
      LEFT JOIN users u ON cr.user_id = u.id
      WHERE cr.document_id = ? AND cr.is_resolved = 0
      ORDER BY cr.created_at DESC
    `).all(documentId);
  }

  getConflictHistory(documentId) {
    return db.prepare(`
      SELECT cr.*, u.name as user_name, ru.name as resolver_name
      FROM conflict_records cr
      LEFT JOIN users u ON cr.user_id = u.id
      LEFT JOIN users ru ON cr.resolved_by = ru.id
      WHERE cr.document_id = ?
      ORDER BY cr.created_at DESC
    `).all(documentId);
  }
}

module.exports = new ConflictMergeEngine();
