const { db } = require('../database');

class TagRuleEngine {
  constructor() {
    this.tagCache = new Map();
  }

  validateTags(tagIds, operation = 'use') {
    const tags = db.prepare('SELECT * FROM tags WHERE id IN (' + tagIds.map(() => '?').join(',') + ')')
      .all(tagIds);

    const lockedTags = tags.filter(t => t.is_locked === 1 && operation === 'use');
    if (lockedTags.length > 0) {
      return {
        valid: false,
        error: `以下标签已被锁定: ${lockedTags.map(t => t.name).join(', ')}`
      };
    }

    return { valid: true, tags };
  }

  lockTags(tagIds, userId) {
    const updateStmt = db.prepare('UPDATE tags SET is_locked = 1 WHERE id IN (' + tagIds.map(() => '?').join(',') + ')');
    const result = updateStmt.run(...tagIds);

    tagIds.forEach(id => {
      const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
      if (tag) {
        this.tagCache.set(id, { ...tag, locked: true });
        this.logAudit('tag_lock', 'tag', id, null, JSON.stringify({ locked: true }), userId);
      }
    });

    return result.changes;
  }

  unlockTags(tagIds, userId) {
    const updateStmt = db.prepare('UPDATE tags SET is_locked = 0 WHERE id IN (' + tagIds.map(() => '?').join(',') + ')');
    const result = updateStmt.run(...tagIds);

    tagIds.forEach(id => {
      this.tagCache.delete(id);
      this.logAudit('tag_unlock', 'tag', id, JSON.stringify({ locked: true }), JSON.stringify({ locked: false }), userId);
    });

    return result.changes;
  }

  linkDocumentTags(documentId, tagIds, userId) {
    const validation = this.validateTags(tagIds, 'use');
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const existingTags = db.prepare('SELECT tag_id FROM document_tags WHERE document_id = ?').all(documentId);
    const existingTagIds = new Set(existingTags.map(t => t.tag_id));

    const insertStmt = db.prepare('INSERT OR IGNORE INTO document_tags (document_id, tag_id) VALUES (?, ?)');
    const deleteStmt = db.prepare('DELETE FROM document_tags WHERE document_id = ? AND tag_id = ?');

    tagIds.forEach(tagId => {
      insertStmt.run(documentId, tagId);
      existingTagIds.delete(tagId);
    });

    existingTagIds.forEach(tagId => {
      deleteStmt.run(documentId, tagId);
    });

    this.logAudit('document_tags_update', 'document', documentId, null, JSON.stringify({ tagIds }), userId);

    return { success: true };
  }

  getDocumentTags(documentId) {
    return db.prepare(`
      SELECT t.* FROM tags t
      JOIN document_tags dt ON t.id = dt.tag_id
      WHERE dt.document_id = ?
    `).all(documentId);
  }

  searchDocumentsByTags(tagIds, operator = 'AND') {
    if (tagIds.length === 0) return [];

    let query;
    if (operator === 'AND') {
      query = `
        SELECT d.* FROM documents d
        WHERE d.id IN (
          SELECT dt.document_id FROM document_tags dt
          WHERE dt.tag_id IN (${tagIds.map(() => '?').join(',')})
          GROUP BY dt.document_id
          HAVING COUNT(DISTINCT dt.tag_id) = ?
        )
      `;
      return db.prepare(query).all(...tagIds, tagIds.length);
    } else {
      query = `
        SELECT DISTINCT d.* FROM documents d
        JOIN document_tags dt ON d.id = dt.document_id
        WHERE dt.tag_id IN (${tagIds.map(() => '?').join(',')})
      `;
      return db.prepare(query).all(...tagIds);
    }
  }

  logAudit(action, resourceType, resourceId, oldValue, newValue, userId) {
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId);
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id, old_value, new_value)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, user?.name || null, action, resourceType, resourceId, oldValue, newValue);
  }
}

module.exports = new TagRuleEngine();
