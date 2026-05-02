const { db } = require('../database');
const { v4: uuidv4 } = require('uuid');

class MaterialCopyrightVersionEngine {
  constructor() {
    this.copyrightStatuses = {
      PENDING: 'pending',
      APPROVED: 'approved',
      EXPIRED: 'expired',
      REJECTED: 'rejected'
    };
  }

  createVersion(documentId, userId, changeLog, content = null, title = null) {
    const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);
    if (!document) {
      return { success: false, error: '文档不存在' };
    }

    const newVersionNo = document.version + 1;

    db.prepare(`
      INSERT INTO versions (document_id, version_no, title, content, change_log, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      documentId,
      newVersionNo,
      title || document.title,
      content || document.content,
      changeLog,
      userId
    );

    db.prepare(`
      UPDATE documents SET version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(newVersionNo, documentId);

    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId);
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id, details)
      VALUES (?, ?, 'version_created', 'document', ?, ?)
    `).run(
      userId,
      user?.name,
      documentId,
      JSON.stringify({ version: newVersionNo, changeLog })
    );

    this.addTimelineEvent(documentId, 'version', `创建版本 v${newVersionNo}`, changeLog, userId);

    return {
      success: true,
      versionNo: newVersionNo,
      mainOrderNo: document.main_order_no
    };
  }

  getVersion(documentId, versionNo) {
    return db.prepare(`
      SELECT v.*, u.name as creator_name
      FROM versions v
      LEFT JOIN users u ON v.created_by = u.id
      WHERE v.document_id = ? AND v.version_no = ?
    `).get(documentId, versionNo);
  }

  getVersionHistory(documentId) {
    return db.prepare(`
      SELECT v.*, u.name as creator_name
      FROM versions v
      LEFT JOIN users u ON v.created_by = u.id
      WHERE v.document_id = ?
      ORDER BY v.version_no DESC
    `).all(documentId);
  }

  rollbackVersion(documentId, targetVersionNo, userId, rollbackReason) {
    const targetVersion = this.getVersion(documentId, targetVersionNo);
    if (!targetVersion) {
      return { success: false, error: '目标版本不存在' };
    }

    const currentDocument = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);
    const newVersionNo = currentDocument.version + 1;

    db.prepare(`
      INSERT INTO versions (document_id, version_no, title, content, change_log, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      documentId,
      newVersionNo,
      targetVersion.title,
      targetVersion.content,
      `回退到版本 v${targetVersionNo}。原因: ${rollbackReason}`,
      userId
    );

    db.prepare(`
      UPDATE documents 
      SET version = ?, title = ?, content = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(newVersionNo, targetVersion.title, targetVersion.content, documentId);

    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId);
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id, old_value, new_value, details)
      VALUES (?, ?, 'version_rollback', 'document', ?, ?, ?, ?)
    `).run(
      userId,
      user?.name,
      documentId,
      JSON.stringify({ version: currentDocument.version }),
      JSON.stringify({ version: newVersionNo, targetVersion: targetVersionNo }),
      JSON.stringify({ rollbackReason })
    );

    this.addTimelineEvent(
      documentId,
      'rollback',
      `回退到版本 v${targetVersionNo}`,
      rollbackReason,
      userId
    );

    return {
      success: true,
      newVersion: newVersionNo,
      targetVersion: targetVersionNo
    };
  }

  checkCopyright(attachmentId) {
    const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(attachmentId);
    if (!attachment) {
      return { valid: false, error: '附件不存在' };
    }

    const now = new Date().toISOString().split('T')[0];
    const status = {
      ...attachment,
      isExpired: false,
      isValid: true
    };

    if (attachment.copyright_status === this.copyrightStatuses.EXPIRED) {
      status.isExpired = true;
      status.isValid = false;
    }

    if (attachment.copyright_expiry_date && attachment.copyright_expiry_date < now) {
      status.isExpired = true;
      status.isValid = false;
      status.autoExpired = true;
    }

    return status;
  }

  checkAllDocumentCopyrights(documentId) {
    const attachments = db.prepare('SELECT * FROM attachments WHERE document_id = ?').all(documentId);
    const results = attachments.map(att => this.checkCopyright(att.id));

    const hasInvalid = results.some(r => !r.isValid);
    const hasExpired = results.some(r => r.isExpired);

    return {
      documentId,
      hasInvalid,
      hasExpired,
      attachments: results
    };
  }

  updateCopyrightStatus(attachmentId, status, expiryDate = null, userId = null) {
    const validStatuses = Object.values(this.copyrightStatuses);
    if (!validStatuses.includes(status)) {
      return { success: false, error: '无效的版权状态' };
    }

    const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(attachmentId);
    if (!attachment) {
      return { success: false, error: '附件不存在' };
    }

    db.prepare(`
      UPDATE attachments 
      SET copyright_status = ?, copyright_expiry_date = ?
      WHERE id = ?
    `).run(status, expiryDate, attachmentId);

    if (userId) {
      const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId);
      db.prepare(`
        INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id, old_value, new_value)
        VALUES (?, ?, 'copyright_update', 'attachment', ?, ?, ?)
      `).run(
        userId,
        user?.name,
        attachmentId,
        JSON.stringify({ status: attachment.copyright_status }),
        JSON.stringify({ status, expiryDate })
      );
    }

    return { success: true };
  }

  checkExternalLink(linkId) {
    const link = db.prepare('SELECT * FROM external_links WHERE id = ?').get(linkId);
    if (!link) {
      return { valid: false, error: '链接不存在' };
    }

    return {
      ...link,
      isValid: link.is_valid === 1
    };
  }

  markLinkInvalid(linkId, userId = null) {
    db.prepare(`
      UPDATE external_links 
      SET is_valid = 0, last_checked_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(linkId);

    const link = db.prepare('SELECT * FROM external_links WHERE id = ?').get(linkId);
    if (link && userId) {
      this.addTimelineEvent(
        link.document_id,
        'link_invalid',
        '外链失效',
        `链接 ${link.link_url} 已失效`,
        userId
      );
    }

    return { success: true };
  }

  generateMainOrderNo(prefix = 'KB') {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');

    const countResult = db.prepare(`
      SELECT COUNT(*) as count FROM documents 
      WHERE main_order_no LIKE ?
    `).get(`${prefix}${dateStr}%`);

    const sequence = (countResult?.count || 0) + 1;
    const sequenceStr = sequence.toString().padStart(4, '0');

    return `${prefix}${dateStr}${sequenceStr}`;
  }

  addTimelineEvent(documentId, eventType, title, details, userId = null) {
    const user = userId ? db.prepare('SELECT name FROM users WHERE id = ?').get(userId) : null;

    db.prepare(`
      INSERT INTO timeline_events (document_id, event_type, event_title, event_details, user_id, user_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(documentId, eventType, title, details, userId, user?.name || null);
  }

  getTimeline(documentId) {
    return db.prepare(`
      SELECT * FROM timeline_events 
      WHERE document_id = ? 
      ORDER BY created_at DESC
    `).all(documentId);
  }
}

module.exports = new MaterialCopyrightVersionEngine();
