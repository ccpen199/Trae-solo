const { v4: uuidv4 } = require('uuid');

const ORDER_STATUSES = {
  PENDING_LOCATION: 'PENDING_LOCATION',
  PENDING_ROUTE_PLANNING: 'PENDING_ROUTE_PLANNING',
  NAVIGATION_EXECUTING: 'NAVIGATION_EXECUTING',
  PENDING_TRAJECTORY: 'PENDING_TRAJECTORY',
  ARRIVAL_CONFIRMED: 'ARRIVAL_CONFIRMED',
  CANCELLED: 'CANCELLED',
  EXCEPTION: 'EXCEPTION'
};

const STATUS_DISPLAY_NAMES = {
  PENDING_LOCATION: '待输入位置',
  PENDING_ROUTE_PLANNING: '待路线规划',
  NAVIGATION_EXECUTING: '导航执行中',
  PENDING_TRAJECTORY: '待轨迹记录',
  ARRIVAL_CONFIRMED: '已到达确认',
  CANCELLED: '已取消',
  EXCEPTION: '异常中'
};

const ROLES = {
  USER: 'USER',
  DRIVER: 'DRIVER',
  DISPATCHER: 'DISPATCHER',
  MAP_PROVIDER: 'MAP_PROVIDER',
  OPERATOR: 'OPERATOR'
};

const STATE_TRANSITIONS = {
  [ORDER_STATUSES.PENDING_LOCATION]: {
    allowedActions: ['submit_location', 'cancel_order'],
    forbiddenActions: ['start_navigation', 'record_trajectory', 'confirm_arrival'],
    responsibleRoles: [ROLES.USER, ROLES.DISPATCHER],
    nextStatuses: [ORDER_STATUSES.PENDING_ROUTE_PLANNING, ORDER_STATUSES.CANCELLED]
  },
  [ORDER_STATUSES.PENDING_ROUTE_PLANNING]: {
    allowedActions: ['approve_route', 'reject_route', 'request_more_info', 'reassign', 'cancel_order'],
    forbiddenActions: ['start_navigation', 'confirm_arrival'],
    responsibleRoles: [ROLES.DISPATCHER, ROLES.MAP_PROVIDER],
    nextStatuses: [ORDER_STATUSES.NAVIGATION_EXECUTING, ORDER_STATUSES.PENDING_LOCATION, ORDER_STATUSES.CANCELLED]
  },
  [ORDER_STATUSES.NAVIGATION_EXECUTING]: {
    allowedActions: ['update_location', 'report_deviation', 'pause_navigation', 'resume_navigation', 'complete_navigation', 'cancel_order'],
    forbiddenActions: ['confirm_arrival'],
    responsibleRoles: [ROLES.DRIVER],
    nextStatuses: [ORDER_STATUSES.PENDING_TRAJECTORY, ORDER_STATUSES.EXCEPTION, ORDER_STATUSES.CANCELLED]
  },
  [ORDER_STATUSES.PENDING_TRAJECTORY]: {
    allowedActions: ['submit_trajectory', 'lock_poi', 'unlock_poi', 'confirm_arrival', 'cancel_order'],
    forbiddenActions: ['start_navigation'],
    responsibleRoles: [ROLES.DRIVER, ROLES.DISPATCHER],
    nextStatuses: [ORDER_STATUSES.ARRIVAL_CONFIRMED, ORDER_STATUSES.NAVIGATION_EXECUTING, ORDER_STATUSES.CANCELLED]
  },
  [ORDER_STATUSES.ARRIVAL_CONFIRMED]: {
    allowedActions: ['view_details'],
    forbiddenActions: ['start_navigation', 'cancel_order', 'reject_route'],
    responsibleRoles: [ROLES.USER, ROLES.DISPATCHER, ROLES.OPERATOR],
    nextStatuses: []
  },
  [ORDER_STATUSES.EXCEPTION]: {
    allowedActions: ['resolve_exception', 'retry', 'assign_to_other', 'cancel_order'],
    forbiddenActions: ['confirm_arrival'],
    responsibleRoles: [ROLES.DISPATCHER, ROLES.OPERATOR],
    nextStatuses: [ORDER_STATUSES.NAVIGATION_EXECUTING, ORDER_STATUSES.PENDING_TRAJECTORY, ORDER_STATUSES.CANCELLED, ORDER_STATUSES.ARRIVAL_CONFIRMED]
  },
  [ORDER_STATUSES.CANCELLED]: {
    allowedActions: ['view_details'],
    forbiddenActions: ['start_navigation', 'confirm_arrival', 'approve_route'],
    responsibleRoles: [ROLES.DISPATCHER, ROLES.OPERATOR],
    nextStatuses: []
  }
};

const ACTION_RESPONSIBILITIES = {
  submit_location: {
    fromStatus: ORDER_STATUSES.PENDING_LOCATION,
    toStatus: ORDER_STATUSES.PENDING_ROUTE_PLANNING,
    allowedRoles: [ROLES.USER, ROLES.DISPATCHER],
    requiredFields: ['origin_lat', 'origin_lng', 'dest_lat', 'dest_lng'],
    affects: ['主单状态', '明细状态', '消息通知']
  },
  cancel_order: {
    fromStatus: '*',
    toStatus: ORDER_STATUSES.CANCELLED,
    allowedRoles: [ROLES.USER, ROLES.DISPATCHER],
    requiredFields: ['cancel_reason'],
    affects: ['主单状态', '明细状态', '消息通知', 'POI解锁']
  },
  approve_route: {
    fromStatus: ORDER_STATUSES.PENDING_ROUTE_PLANNING,
    toStatus: ORDER_STATUSES.NAVIGATION_EXECUTING,
    allowedRoles: [ROLES.DISPATCHER, ROLES.MAP_PROVIDER],
    requiredFields: ['route_id', 'driver_id'],
    affects: ['主单状态', '明细状态', '消息通知', '路线选择']
  },
  reject_route: {
    fromStatus: ORDER_STATUSES.PENDING_ROUTE_PLANNING,
    toStatus: ORDER_STATUSES.PENDING_LOCATION,
    allowedRoles: [ROLES.DISPATCHER, ROLES.MAP_PROVIDER],
    requiredFields: ['reject_reason'],
    affects: ['主单状态', '明细状态', '消息通知', '时间轴']
  },
  request_more_info: {
    fromStatus: ORDER_STATUSES.PENDING_ROUTE_PLANNING,
    toStatus: ORDER_STATUSES.PENDING_ROUTE_PLANNING,
    allowedRoles: [ROLES.DISPATCHER, ROLES.MAP_PROVIDER],
    requiredFields: ['info_requested'],
    affects: ['消息通知', '时间轴']
  },
  reassign: {
    fromStatus: ORDER_STATUSES.PENDING_ROUTE_PLANNING,
    toStatus: ORDER_STATUSES.PENDING_ROUTE_PLANNING,
    allowedRoles: [ROLES.DISPATCHER],
    requiredFields: ['new_responsible_id', 'new_responsible_role'],
    affects: ['责任人分配', '消息通知', '时间轴']
  },
  update_location: {
    fromStatus: ORDER_STATUSES.NAVIGATION_EXECUTING,
    toStatus: ORDER_STATUSES.NAVIGATION_EXECUTING,
    allowedRoles: [ROLES.DRIVER],
    requiredFields: ['lat', 'lng', 'timestamp'],
    affects: ['轨迹记录', 'ETA计算']
  },
  report_deviation: {
    fromStatus: ORDER_STATUSES.NAVIGATION_EXECUTING,
    toStatus: ORDER_STATUSES.EXCEPTION,
    allowedRoles: [ROLES.DRIVER, ROLES.MAP_PROVIDER],
    requiredFields: ['deviation_type', 'current_location'],
    affects: ['异常队列', '消息通知', '时间轴']
  },
  pause_navigation: {
    fromStatus: ORDER_STATUSES.NAVIGATION_EXECUTING,
    toStatus: ORDER_STATUSES.NAVIGATION_EXECUTING,
    allowedRoles: [ROLES.DRIVER],
    requiredFields: ['pause_reason'],
    affects: ['时间轴', 'ETA修正']
  },
  resume_navigation: {
    fromStatus: ORDER_STATUSES.NAVIGATION_EXECUTING,
    toStatus: ORDER_STATUSES.NAVIGATION_EXECUTING,
    allowedRoles: [ROLES.DRIVER],
    requiredFields: [],
    affects: ['时间轴', 'ETA修正']
  },
  complete_navigation: {
    fromStatus: ORDER_STATUSES.NAVIGATION_EXECUTING,
    toStatus: ORDER_STATUSES.PENDING_TRAJECTORY,
    allowedRoles: [ROLES.DRIVER],
    requiredFields: ['arrival_location', 'arrival_time'],
    affects: ['主单状态', '明细状态', '消息通知', 'POI锁定']
  },
  submit_trajectory: {
    fromStatus: ORDER_STATUSES.PENDING_TRAJECTORY,
    toStatus: ORDER_STATUSES.PENDING_TRAJECTORY,
    allowedRoles: [ROLES.DRIVER, ROLES.MAP_PROVIDER],
    requiredFields: ['trajectory_data'],
    affects: ['轨迹记录', '时间轴']
  },
  lock_poi: {
    fromStatus: ORDER_STATUSES.PENDING_TRAJECTORY,
    toStatus: ORDER_STATUSES.PENDING_TRAJECTORY,
    allowedRoles: [ROLES.DISPATCHER, ROLES.MAP_PROVIDER],
    requiredFields: ['poi_id'],
    affects: ['POI状态', '并发控制']
  },
  unlock_poi: {
    fromStatus: '*',
    toStatus: '*',
    allowedRoles: [ROLES.DISPATCHER, ROLES.MAP_PROVIDER],
    requiredFields: ['poi_id'],
    affects: ['POI状态', '并发控制']
  },
  confirm_arrival: {
    fromStatus: ORDER_STATUSES.PENDING_TRAJECTORY,
    toStatus: ORDER_STATUSES.ARRIVAL_CONFIRMED,
    allowedRoles: [ROLES.USER, ROLES.DISPATCHER, ROLES.DRIVER],
    requiredFields: ['confirm_time'],
    affects: ['主单状态', '明细状态', '消息状态', '统计口径', 'POI解锁']
  },
  resolve_exception: {
    fromStatus: ORDER_STATUSES.EXCEPTION,
    toStatus: ORDER_STATUSES.NAVIGATION_EXECUTING,
    allowedRoles: [ROLES.DISPATCHER, ROLES.OPERATOR],
    requiredFields: ['resolution', 'target_status'],
    affects: ['异常队列', '主单状态', '消息通知', '时间轴']
  },
  retry: {
    fromStatus: ORDER_STATUSES.EXCEPTION,
    toStatus: ORDER_STATUSES.NAVIGATION_EXECUTING,
    allowedRoles: [ROLES.DISPATCHER, ROLES.OPERATOR],
    requiredFields: [],
    affects: ['异常队列', '重试计数']
  },
  assign_to_other: {
    fromStatus: ORDER_STATUSES.EXCEPTION,
    toStatus: ORDER_STATUSES.EXCEPTION,
    allowedRoles: [ROLES.DISPATCHER, ROLES.OPERATOR],
    requiredFields: ['new_responsible_id', 'new_responsible_role'],
    affects: ['责任人分配', '消息通知', '时间轴']
  }
};

const EXCEPTION_TYPES = {
  LOCATION_DRIFT: 'LOCATION_DRIFT',
  ROUTE_DEVIATION: 'ROUTE_DEVIATION',
  DRIVER_REJECT: 'DRIVER_REJECT',
  ARRIVAL_NOT_CONFIRMED: 'ARRIVAL_NOT_CONFIRMED',
  MAP_CALLBACK_DELAY: 'MAP_CALLBACK_DELAY',
  POI_LOCK_CONFLICT: 'POI_LOCK_CONFLICT',
  ETA_DISCREPANCY: 'ETA_DISCREPANCY'
};

const EXCEPTION_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

function canTransition(fromStatus, toStatus, userRole) {
  if (!STATE_TRANSITIONS[fromStatus]) {
    return { allowed: false, reason: '无效的当前状态' };
  }

  const stateConfig = STATE_TRANSITIONS[fromStatus];
  
  if (!stateConfig.nextStatuses.includes(toStatus) && toStatus !== ORDER_STATUSES.CANCELLED) {
    return { allowed: false, reason: `状态 ${STATUS_DISPLAY_NAMES[fromStatus]} 无法转换到 ${STATUS_DISPLAY_NAMES[toStatus]}` };
  }

  if (!stateConfig.responsibleRoles.includes(userRole) && userRole !== ROLES.OPERATOR) {
    return { allowed: false, reason: `角色 ${userRole} 无权在当前状态执行操作` };
  }

  return { allowed: true };
}

function canPerformAction(status, action, userRole) {
  if (!STATE_TRANSITIONS[status]) {
    return { allowed: false, reason: '无效的当前状态' };
  }

  const stateConfig = STATE_TRANSITIONS[status];
  
  if (stateConfig.forbiddenActions.includes(action)) {
    return { allowed: false, reason: `当前状态 ${STATUS_DISPLAY_NAMES[status]} 禁止执行动作 ${action}` };
  }

  if (!stateConfig.allowedActions.includes(action)) {
    return { allowed: false, reason: `当前状态 ${STATUS_DISPLAY_NAMES[status]} 不支持动作 ${action}` };
  }

  const actionConfig = ACTION_RESPONSIBILITIES[action];
  if (actionConfig && !actionConfig.allowedRoles.includes(userRole) && userRole !== ROLES.OPERATOR) {
    return { allowed: false, reason: `角色 ${userRole} 无权执行动作 ${action}` };
  }

  return { allowed: true };
}

function getAvailableActions(status, userRole) {
  if (!STATE_TRANSITIONS[status]) {
    return [];
  }

  const stateConfig = STATE_TRANSITIONS[status];
  return stateConfig.allowedActions.filter(action => {
    const actionConfig = ACTION_RESPONSIBILITIES[action];
    return !actionConfig || actionConfig.allowedRoles.includes(userRole) || userRole === ROLES.OPERATOR;
  });
}

function getNextResponsibleRole(fromStatus, action) {
  const actionConfig = ACTION_RESPONSIBILITIES[action];
  if (!actionConfig) return null;

  const nextStatus = actionConfig.toStatus;
  if (nextStatus === '*') return null;

  const nextStateConfig = STATE_TRANSITIONS[nextStatus];
  return nextStateConfig ? nextStateConfig.responsibleRoles[0] : null;
}

function generateOrderNo() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MN${dateStr}${random}`;
}

function generateDetailNo(orderNo, sequence) {
  return `${orderNo}-${String(sequence).padStart(3, '0')}`;
}

function generateId() {
  return uuidv4().replace(/-/g, '').toUpperCase();
}

module.exports = {
  ORDER_STATUSES,
  STATUS_DISPLAY_NAMES,
  ROLES,
  STATE_TRANSITIONS,
  ACTION_RESPONSIBILITIES,
  EXCEPTION_TYPES,
  EXCEPTION_SEVERITY,
  canTransition,
  canPerformAction,
  getAvailableActions,
  getNextResponsibleRole,
  generateOrderNo,
  generateDetailNo,
  generateId
};
