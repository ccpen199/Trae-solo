const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const STATUS_FLOW = {
  draft: {
    display: '草稿',
    next: ['pending_tax_calculation'],
    actions: ['submit']
  },
  pending_tax_calculation: {
    display: '待税额计算',
    next: ['pending_declaration'],
    actions: ['calculate', 'reject', 'reassign'],
    prev: 'draft'
  },
  pending_declaration: {
    display: '待申报提交',
    next: ['pending_receipt'],
    actions: ['submit_declaration', 'reject', 'reassign'],
    prev: 'pending_tax_calculation'
  },
  pending_receipt: {
    display: '待回执获取',
    next: ['pending_risk_check'],
    actions: ['get_receipt', 'reject', 'reassign'],
    prev: 'pending_declaration'
  },
  pending_risk_check: {
    display: '待风险检查',
    next: ['completed', 'rejected', 'supplement'],
    actions: ['approve', 'reject', 'request_supplement', 'reassign'],
    prev: 'pending_receipt'
  },
  supplement: {
    display: '待补充资料',
    next: ['pending_tax_calculation'],
    actions: ['supplement_submit'],
    prev: 'pending_risk_check'
  },
  completed: {
    display: '已完成',
    next: [],
    actions: ['view']
  },
  rejected: {
    display: '已驳回',
    next: [],
    actions: ['view', 'reopen'],
    canReopen: true
  },
  cancelled: {
    display: '已撤销',
    next: [],
    actions: ['view']
  }
};

const StatusService = {
  getStatusDisplay: (status) => {
    return STATUS_FLOW[status]?.display || status;
  },

  getNextStatuses: (status) => {
    return STATUS_FLOW[status]?.next || [];
  },

  getAvailableActions: (status, userRole) => {
    const statusConfig = STATUS_FLOW[status];
    if (!statusConfig) return [];
    
    const actions = statusConfig.actions;
    
    const roleActions = {
      admin: actions,
      finance: actions.filter(a => ['submit', 'supplement_submit', 'view'].includes(a)),
      tax_advisor: actions.filter(a => ['calculate', 'submit_declaration', 'get_receipt', 'view', 'reject', 'reassign'].includes(a)),
      enterprise_manager: actions.filter(a => ['approve', 'reject', 'request_supplement', 'reassign', 'view'].includes(a))
    };
    
    return roleActions[userRole] || ['view'];
  },

  canTransition: (fromStatus, toStatus) => {
    const nextStatuses = StatusService.getNextStatuses(fromStatus);
    return nextStatuses.includes(toStatus);
  },

  transitionStatus: (mainOrderId, fromStatus, toStatus, operatorId, operatorName, operationType, operationReason = '', operationRemark = '') => {
    const toStatusDisplay = StatusService.getStatusDisplay(toStatus);
    
    const flowStmt = db.prepare(`
      INSERT INTO status_flows (
        id, main_order_id, from_status, to_status, to_status_display,
        operator_id, operator_name, operation_type, operation_reason, operation_remark
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    flowStmt.run(
      uuidv4(), mainOrderId, fromStatus, toStatus, toStatusDisplay,
      operatorId, operatorName, operationType, operationReason, operationRemark
    );
    
    const orderStmt = db.prepare(`
      UPDATE main_orders 
      SET status = ?, status_display = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    orderStmt.run(toStatus, toStatusDisplay, mainOrderId);
    
    return { toStatus, toStatusDisplay };
  },

  getAllStatuses: () => {
    return Object.entries(STATUS_FLOW).map(([key, value]) => ({
      status: key,
      display: value.display
    }));
  },

  getPreviousStatus: (status) => {
    return STATUS_FLOW[status]?.prev || null;
  }
};

module.exports = StatusService;
