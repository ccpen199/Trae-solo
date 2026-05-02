const db = require('../config/database');

const generateOrderNo = (prefix = 'LOG') => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  const countStmt = db.prepare(`
    SELECT COUNT(*) as count FROM main_orders 
    WHERE strftime('%Y-%m-%d', created_at) = strftime('%Y-%m-%d', 'now')
  `);
  const result = countStmt.get();
  const sequence = String(result.count + 1).padStart(4, '0');
  
  return `${prefix}${year}${month}${day}${sequence}`;
};

const generateDetailNo = (mainOrderNo) => {
  const countStmt = db.prepare(`
    SELECT COUNT(*) as count FROM order_details 
    WHERE main_order_id IN (SELECT id FROM main_orders WHERE order_no = ?)
  `);
  const result = countStmt.get(mainOrderNo);
  const sequence = String(result.count + 1).padStart(2, '0');
  return `${mainOrderNo}-${sequence}`;
};

const STATUSES = {
  PENDING_COLLECT: 'pending_collect',
  PENDING_PARSE: 'pending_parse',
  PENDING_QUERY: 'pending_query',
  PENDING_ALERT: 'pending_alert',
  ARCHIVED: 'archived'
};

const STATUS_LABELS = {
  [STATUSES.PENDING_COLLECT]: '待日志采集',
  [STATUSES.PENDING_PARSE]: '待解析索引',
  [STATUSES.PENDING_QUERY]: '待查询分析',
  [STATUSES.PENDING_ALERT]: '待告警',
  [STATUSES.ARCHIVED]: '已归档'
};

const ROLES = {
  DEVELOPER: 'developer',
  OPERATOR: 'operator',
  SECURITY: 'security',
  ANALYST: 'analyst',
  ADMIN: 'admin'
};

const ROLE_LABELS = {
  [ROLES.DEVELOPER]: '开发',
  [ROLES.OPERATOR]: '运维',
  [ROLES.SECURITY]: '安全',
  [ROLES.ANALYST]: '数据分析',
  [ROLES.ADMIN]: '管理员'
};

const getNextStatus = (currentStatus) => {
  const flow = [
    STATUSES.PENDING_COLLECT,
    STATUSES.PENDING_PARSE,
    STATUSES.PENDING_QUERY,
    STATUSES.PENDING_ALERT,
    STATUSES.ARCHIVED
  ];
  const index = flow.indexOf(currentStatus);
  return index < flow.length - 1 ? flow[index + 1] : currentStatus;
};

const getRolePermissions = (role) => {
  const permissions = {
    [ROLES.DEVELOPER]: {
      view: ['pending_collect', 'pending_parse', 'pending_query', 'pending_alert', 'archived'],
      actions: ['submit', 'edit', 'view_timeline'],
      modules: ['collector', 'order']
    },
    [ROLES.OPERATOR]: {
      view: ['pending_collect', 'pending_parse', 'pending_query', 'pending_alert', 'archived'],
      actions: ['parse', 'approve', 'reject', 'view_timeline'],
      modules: ['collector', 'index', 'order']
    },
    [ROLES.SECURITY]: {
      view: ['pending_collect', 'pending_parse', 'pending_query', 'pending_alert', 'archived'],
      actions: ['alert', 'approve', 'reject', 'view_timeline'],
      modules: ['alert', 'order']
    },
    [ROLES.ANALYST]: {
      view: ['pending_collect', 'pending_parse', 'pending_query', 'pending_alert', 'archived'],
      actions: ['query', 'approve', 'reject', 'view_timeline'],
      modules: ['query', 'order']
    },
    [ROLES.ADMIN]: {
      view: ['pending_collect', 'pending_parse', 'pending_query', 'pending_alert', 'archived'],
      actions: ['submit', 'parse', 'query', 'alert', 'approve', 'reject', 'archive', 'view_timeline', 'manage'],
      modules: ['collector', 'index', 'query', 'alert', 'order', 'user']
    }
  };
  return permissions[role] || permissions[ROLES.DEVELOPER];
};

module.exports = {
  generateOrderNo,
  generateDetailNo,
  STATUSES,
  STATUS_LABELS,
  ROLES,
  ROLE_LABELS,
  getNextStatus,
  getRolePermissions
};
