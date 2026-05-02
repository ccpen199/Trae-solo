const { db } = require('../database');

const ROLES = {
  ADMIN: 'admin',
  KNOWLEDGE_MANAGER: 'knowledge_manager',
  EXPERT: 'expert',
  CUSTOMER_SERVICE: 'customer_service',
  NEWBIE: 'newbie',
  EMPLOYEE: 'employee'
};

const VISIBILITY_RULES = {
  [ROLES.ADMIN]: {
    canViewAll: true,
    visibleStatuses: ['pending_creation', 'pending_review', 'published', 'pending_use', 'pending_update'],
    visibleSteps: ['create', 'review', 'publish', 'use', 'update']
  },
  [ROLES.KNOWLEDGE_MANAGER]: {
    canViewAll: false,
    visibleStatuses: ['pending_creation', 'pending_review', 'published', 'pending_use', 'pending_update'],
    visibleSteps: ['create', 'review', 'publish', 'use', 'update'],
    canViewCreatedByOthers: true
  },
  [ROLES.EXPERT]: {
    canViewAll: false,
    visibleStatuses: ['pending_creation', 'pending_review', 'published', 'pending_update'],
    visibleSteps: ['create', 'review', 'update'],
    canViewPublished: true
  },
  [ROLES.CUSTOMER_SERVICE]: {
    canViewAll: false,
    visibleStatuses: ['published', 'pending_use'],
    visibleSteps: ['publish', 'use'],
    canViewPublished: true
  },
  [ROLES.NEWBIE]: {
    canViewAll: false,
    visibleStatuses: ['published'],
    visibleSteps: ['publish'],
    canViewPublished: true,
    canEdit: false
  },
  [ROLES.EMPLOYEE]: {
    canViewAll: false,
    visibleStatuses: ['pending_creation', 'published'],
    visibleSteps: ['create', 'publish'],
    canViewOwnOnly: true,
    canViewPublished: true
  }
};

const ACTION_RULES = {
  [ROLES.ADMIN]: ['create', 'edit', 'view', 'review', 'publish', 'delete', 'assign', 'reassign', 'rollback', 'search', 'manage'],
  [ROLES.KNOWLEDGE_MANAGER]: ['create', 'edit', 'view', 'review', 'publish', 'assign', 'reassign', 'rollback', 'search', 'manage_tags'],
  [ROLES.EXPERT]: ['create', 'edit', 'view', 'review', 'search'],
  [ROLES.CUSTOMER_SERVICE]: ['view', 'search'],
  [ROLES.NEWBIE]: ['view', 'search'],
  [ROLES.EMPLOYEE]: ['create', 'view', 'search']
};

class PermissionRuleEngine {
  constructor() {
    this.permissionCache = new Map();
  }

  checkPermission(userId, resourceType, action, resourceId = null) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return { allowed: false, reason: '用户不存在' };
    }

    if (user.role === ROLES.ADMIN) {
      return { allowed: true, role: user.role };
    }

    const roleActions = ACTION_RULES[user.role] || [];
    if (!roleActions.includes(action) && !roleActions.includes('all')) {
      return { allowed: false, reason: `角色${user.role}没有${action}权限` };
    }

    if (resourceId) {
      const resourceCheck = this.checkResourceAccess(user, resourceType, resourceId, action);
      if (!resourceCheck.allowed) {
        return resourceCheck;
      }
    }

    return { allowed: true, role: user.role };
  }

  checkResourceAccess(user, resourceType, resourceId, action) {
    if (resourceType === 'document') {
      const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(resourceId);
      if (!doc) {
        return { allowed: false, reason: '文档不存在' };
      }

      const visibility = VISIBILITY_RULES[user.role];
      if (!visibility) {
        return { allowed: false, reason: '未知角色权限' };
      }

      if (visibility.canViewAll) {
        return { allowed: true };
      }

      if (visibility.canViewOwnOnly && doc.created_by !== user.id && doc.responsible_id !== user.id) {
        return { allowed: false, reason: '只能查看自己创建或负责的文档' };
      }

      if (action === 'view') {
        if (!visibility.visibleStatuses.includes(doc.status)) {
          return { allowed: false, reason: '该状态的文档不可查看' };
        }
        if (doc.status === 'published' && visibility.canViewPublished) {
          return { allowed: true };
        }
      }

      if (doc.created_by === user.id || doc.responsible_id === user.id) {
        return { allowed: true };
      }

      if (user.role === ROLES.KNOWLEDGE_MANAGER && visibility.canViewCreatedByOthers) {
        return { allowed: true };
      }
    }

    return { allowed: true };
  }

  getVisibleDocuments(userId, filters = {}) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) return [];

    const visibility = VISIBILITY_RULES[user.role] || VISIBILITY_RULES[ROLES.EMPLOYEE];
    let query = 'SELECT d.*, u.name as creator_name, r.name as responsible_name FROM documents d';
    query += ' LEFT JOIN users u ON d.created_by = u.id';
    query += ' LEFT JOIN users r ON d.responsible_id = r.id';
    query += ' WHERE d.is_deleted = 0';

    const params = [];

    if (!visibility.canViewAll) {
      const conditions = [];

      if (visibility.canViewPublished && visibility.visibleStatuses.includes('published')) {
        conditions.push('d.status = ?');
        params.push('published');
      }

      if (visibility.canViewOwnOnly || user.role === ROLES.EMPLOYEE) {
        conditions.push('(d.created_by = ? OR d.responsible_id = ?)');
        params.push(user.id, user.id);
      }

      if (conditions.length > 0) {
        query += ' AND (' + conditions.join(' OR ') + ')';
      }
    }

    if (filters.status) {
      query += ' AND d.status = ?';
      params.push(filters.status);
    }

    if (filters.keyword) {
      query += ' AND (d.title LIKE ? OR d.content LIKE ? OR d.summary LIKE ?)';
      const keyword = `%${filters.keyword}%`;
      params.push(keyword, keyword, keyword);
    }

    if (filters.directory_id) {
      query += ' AND d.directory_id = ?';
      params.push(filters.directory_id);
    }

    query += ' ORDER BY d.updated_at DESC';

    return db.prepare(query).all(...params);
  }

  getAvailableActions(userId, documentId) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);

    if (!user || !doc) {
      return [];
    }

    const actions = [];
    const roleActions = ACTION_RULES[user.role] || [];

    if (doc.status === 'pending_creation') {
      if (doc.created_by === user.id && roleActions.includes('edit')) {
        actions.push({ action: 'edit', label: '编辑', description: '编辑文档内容' });
        actions.push({ action: 'submit_review', label: '提交审核', description: '提交文档进行分类审核' });
      }
      if (roleActions.includes('delete') && doc.created_by === user.id) {
        actions.push({ action: 'delete', label: '删除', description: '删除该文档' });
      }
    }

    if (doc.status === 'pending_review') {
      if ((doc.responsible_id === user.id || user.role === ROLES.KNOWLEDGE_MANAGER) && roleActions.includes('review')) {
        actions.push({ action: 'approve', label: '通过审核', description: '审核通过，进入发布流程' });
        actions.push({ action: 'reject', label: '驳回', description: '审核驳回，返回修改' });
        actions.push({ action: 'supplement', label: '补充资料', description: '要求补充资料' });
        actions.push({ action: 'reassign', label: '转派', description: '转派给其他审核人' });
      }
      if (doc.created_by === user.id) {
        actions.push({ action: 'view', label: '查看', description: '查看审核进度' });
      }
    }

    if (doc.status === 'published') {
      if (roleActions.includes('view')) {
        actions.push({ action: 'view', label: '查看', description: '查看文档详情' });
      }
      if (roleActions.includes('search')) {
        actions.push({ action: 'search_use', label: '搜索使用', description: '标记文档已被使用' });
      }
      if ((doc.created_by === user.id || user.role === ROLES.KNOWLEDGE_MANAGER) && roleActions.includes('edit')) {
        actions.push({ action: 'request_update', label: '申请更新', description: '申请更新文档内容' });
      }
      if (roleActions.includes('rollback') && user.role === ROLES.KNOWLEDGE_MANAGER) {
        actions.push({ action: 'rollback', label: '版本回退', description: '回退到历史版本' });
      }
    }

    if (doc.status === 'pending_update') {
      if ((doc.created_by === user.id || user.role === ROLES.EXPERT) && roleActions.includes('edit')) {
        actions.push({ action: 'edit', label: '编辑更新', description: '编辑更新内容' });
        actions.push({ action: 'submit_update', label: '提交更新', description: '提交更新内容' });
      }
      if (user.role === ROLES.KNOWLEDGE_MANAGER && roleActions.includes('review')) {
        actions.push({ action: 'approve_update', label: '通过更新', description: '审核通过更新' });
        actions.push({ action: 'reject_update', label: '驳回更新', description: '驳回更新申请' });
        actions.push({ action: 'supplement_update', label: '补充资料', description: '要求补充更新资料' });
        actions.push({ action: 'reassign_update', label: '转派', description: '转派更新审核' });
      }
    }

    return actions;
  }

  hasPermission(userId, action, resourceType = 'document') {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) return false;

    if (user.role === ROLES.ADMIN) return true;

    const roleActions = ACTION_RULES[user.role] || [];
    return roleActions.includes(action);
  }

  getUserRole(userId) {
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
    return user?.role || null;
  }
}

module.exports = {
  PermissionRuleEngine: new PermissionRuleEngine(),
  ROLES,
  VISIBILITY_RULES,
  ACTION_RULES
};
