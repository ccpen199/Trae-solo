const db = require('../database/init');

class LegalTimeline {
  static addEvent(caseId, eventType, title, description, createdBy, referenceType = null, referenceId = null) {
    return new Promise((resolve, reject) => {
      const eventDate = new Date().toISOString();
      db.run(
        `INSERT INTO timeline_events (case_id, event_type, title, description, event_date, created_by, reference_type, reference_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [caseId, eventType, title, description, eventDate, createdBy, referenceType, referenceId],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, caseId, eventType, title, eventDate });
        }
      );
    });
  }

  static getCaseTimeline(caseId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT te.*, u.name as creator_name
         FROM timeline_events te
         LEFT JOIN users u ON te.created_by = u.id
         WHERE te.case_id = ?
         ORDER BY te.event_date DESC`,
        [caseId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static createCaseCreatedEvent(caseId, createdBy) {
    return this.addEvent(
      caseId,
      'case_created',
      '案件创建',
      '案件已正式创建并进入办理流程',
      createdBy,
      'case',
      caseId
    );
  }

  static createEvidenceUploadedEvent(caseId, evidenceId, uploadedBy) {
    return this.addEvent(
      caseId,
      'evidence_uploaded',
      '证据上传',
      '新证据已上传并存证',
      uploadedBy,
      'evidence',
      evidenceId
    );
  }

  static createDocumentUpdatedEvent(caseId, documentId, version, editedBy) {
    return this.addEvent(
      caseId,
      'document_updated',
      '文书更新',
      `文书已更新至版本 ${version}`,
      editedBy,
      'document',
      documentId
    );
  }

  static createHearingSignedEvent(caseId, signedBy) {
    return this.addEvent(
      caseId,
      'hearing_signed',
      '开庭签到',
      '律师已完成开庭签到',
      signedBy,
      'case',
      caseId
    );
  }

  static createCaseClosedEvent(caseId, closedBy) {
    return this.addEvent(
      caseId,
      'case_closed',
      '案件结案',
      '案件已正式结案归档',
      closedBy,
      'case',
      caseId
    );
  }

  static createCommunicationEvent(caseId, logId, createdBy) {
    return this.addEvent(
      caseId,
      'communication',
      '外联记录',
      '新增外联沟通记录',
      createdBy,
      'communication',
      logId
    );
  }
}

module.exports = LegalTimeline;
