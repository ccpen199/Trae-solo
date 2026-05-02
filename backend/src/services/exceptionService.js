const { v4: uuidv4 } = require('uuid');

class ExceptionService {
  constructor(db) {
    this.db = db;
  }

  exceptionTypes = {
    EDIT_CONFLICT: 'edit_conflict',
    LICENSE_EXPIRED: 'license_expired',
    AUDIT_REJECTED: 'audit_rejected',
    VERSION_ROLLBACK: 'version_rollback',
    LINK_EXPIRED: 'link_expired',
    TASK_OVERDUE: 'task_overdue',
    MILESTONE_AT_RISK: 'milestone_at_risk',
    APPROVAL_PENDING: 'approval_pending'
  };

  createException(type, title, options = {}) {
    const { project_id, entity_type, entity_id, description, priority, assigned_to } = options;

    const exceptionId = uuidv4();

    const insertException = this.db.prepare(`
      INSERT INTO exception_queue (
        id, type, project_id, entity_type, entity_id, title, description,
        status, priority, assigned_to, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    insertException.run(
      exceptionId,
      type,
      project_id,
      entity_type,
      entity_id,
      title,
      description,
      'pending',
      priority || 'medium',
      assigned_to
    );

    if (assigned_to) {
      this.createNotification(assigned_to, 'exception', '异常提醒', title, entity_type, entity_id);
    }

    return this.getExceptionById(exceptionId);
  }

  getExceptionById(exceptionId) {
    return this.db.prepare(`
      SELECT 
        eq.*,
        p.name as project_name,
        p.project_no,
        assignee.name as assigned_to_name,
        resolver.name as resolved_by_name
      FROM exception_queue eq
      LEFT JOIN projects p ON eq.project_id = p.id
      LEFT JOIN users assignee ON eq.assigned_to = assignee.id
      LEFT JOIN users resolver ON eq.resolved_by = resolver.id
      WHERE eq.id = ?
    `).get(exceptionId);
  }

  getExceptions(filters = {}) {
    let baseQuery = `
      SELECT 
        eq.*,
        p.name as project_name,
        p.project_no,
        assignee.name as assigned_to_name
      FROM exception_queue eq
      LEFT JOIN projects p ON eq.project_id = p.id
      LEFT JOIN users assignee ON eq.assigned_to = assignee.id
    `;

    const conditions = [];
    const params = [];

    if (filters.status) {
      conditions.push('eq.status = ?');
      params.push(filters.status);
    }
    if (filters.type) {
      conditions.push('eq.type = ?');
      params.push(filters.type);
    }
    if (filters.project_id) {
      conditions.push('eq.project_id = ?');
      params.push(filters.project_id);
    }
    if (filters.assigned_to) {
      conditions.push('eq.assigned_to = ?');
      params.push(filters.assigned_to);
    }

    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
    }

    baseQuery += ' ORDER BY eq.created_at DESC';

    return this.db.prepare(baseQuery).all(...params);
  }

  resolveException(exceptionId, userId, resolution) {
    const exception = this.getExceptionById(exceptionId);
    if (!exception) {
      throw new Error('异常记录不存在');
    }

    const updateException = this.db.prepare(`
      UPDATE exception_queue 
      SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP, resolved_by = ?, resolution = ?
      WHERE id = ?
    `);

    updateException.run(userId, resolution, exceptionId);

    if (exception.assigned_to) {
      this.createNotification(exception.assigned_to, 'exception_resolved', '异常已解决', `异常「${exception.title}」已解决`, exception.entity_type, exception.entity_id);
    }

    return this.getExceptionById(exceptionId);
  }

  getDashboardExceptions(userId, userRole) {
    let query = `
      SELECT 
        eq.*,
        p.name as project_name,
        p.project_no,
        assignee.name as assigned_to_name
      FROM exception_queue eq
      LEFT JOIN projects p ON eq.project_id = p.id
      LEFT JOIN users assignee ON eq.assigned_to = assignee.id
      WHERE eq.status = 'pending'
    `;

    const params = [];

    if (userRole !== 'management') {
      query += ` AND (eq.assigned_to = ? OR p.project_manager_id = ?)`;
      params.push(userId, userId);
    }

    query += ' ORDER BY eq.created_at DESC LIMIT 50';

    return this.db.prepare(query).all(...params);
  }

  createEditConflict(documentId, baseVersion, userAId, userBId, contentA, contentB) {
    const document = this.db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);
    if (!document) throw new Error('文档不存在');

    const conflictId = uuidv4();
    const conflictVersion = document.version + 1;

    const insertConflict = this.db.prepare(`
      INSERT INTO edit_conflicts (
        id, document_id, base_version, conflict_version,
        user_a_id, user_b_id, content_a, content_b, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `);

    insertConflict.run(
      conflictId, documentId, baseVersion, conflictVersion,
      userAId, userBId, contentA, contentB
    );

    return this.createException(
      this.exceptionTypes.EDIT_CONFLICT,
      `文档「${document.title}」存在编辑冲突`,
      {
        project_id: document.project_id,
        entity_type: 'document',
        entity_id: documentId,
        description: `多人同时编辑文档，请处理冲突后再保存`,
        priority: 'high',
        assigned_to: document.author_id
      }
    );
  }

  createNotification(userId, type, title, content, entityType, entityId) {
    const insertNotif = this.db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, content, entity_type, entity_id, action_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    insertNotif.run(
      uuidv4(),
      userId,
      type,
      title,
      content,
      entityType,
      entityId,
      entityId ? `/${entityType}s/${entityId}` : '/dashboard'
    );
  }

  getStatistics() {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM exception_queue').get().count;
    const pending = this.db.prepare("SELECT COUNT(*) as count FROM exception_queue WHERE status = 'pending'").get().count;
    const resolved = this.db.prepare("SELECT COUNT(*) as count FROM exception_queue WHERE status = 'resolved'").get().count;

    const byType = this.db.prepare(`
      SELECT type, COUNT(*) as count 
      FROM exception_queue 
      GROUP BY type
    `).all();

    return {
      total,
      pending,
      resolved,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item.count;
        return acc;
      }, {})
    };
  }
}

module.exports = ExceptionService;
