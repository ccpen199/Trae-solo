const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

const generateOrderNo = () => {
  const dateStr = dayjs().format('YYYYMMDD');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PK${dateStr}${random}`;
};

const generatePaymentNo = () => {
  const dateStr = dayjs().format('YYYYMMDD');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PY${dateStr}${random}`;
};

const generateCardNo = () => {
  const dateStr = dayjs().format('YYMM');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MC${dateStr}${random}`;
};

const STATUS_FLOW = {
  pending_entry: {
    name: '待车牌入场',
    next: ['pending_parking'],
    actions: ['park']
  },
  pending_parking: {
    name: '待车位停放',
    next: ['pending_billing'],
    actions: ['confirm_parking']
  },
  pending_billing: {
    name: '待出场计费',
    next: ['pending_payment', 'pending_entry'],
    actions: ['approve', 'reject', 'supplement', 'reassign']
  },
  pending_payment: {
    name: '待支付抬杆',
    next: ['pending_reconciliation', 'pending_billing'],
    actions: ['pay', 'cancel']
  },
  pending_reconciliation: {
    name: '待对账',
    next: ['completed'],
    actions: ['reconcile']
  },
  completed: {
    name: '已完成',
    next: [],
    actions: []
  },
  cancelled: {
    name: '已取消',
    next: [],
    actions: []
  }
};

const validateStatusTransition = (currentStatus, targetStatus) => {
  const current = STATUS_FLOW[currentStatus];
  if (!current) return false;
  return current.next.includes(targetStatus);
};

const getStatusName = (status) => {
  return STATUS_FLOW[status]?.name || status;
};

const getAvailableActions = (status, userRole) => {
  const statusConfig = STATUS_FLOW[status];
  if (!statusConfig) return [];

  const roleActionMap = {
    owner: ['submit', 'view', 'pay'],
    toll: ['approve', 'reject', 'supplement', 'reassign', 'pay', 'confirm_parking', 'park'],
    operator: ['approve', 'reject', 'supplement', 'reassign', 'pay', 'confirm_parking', 'park', 'reconcile', 'cancel'],
    finance: ['view', 'reconcile'],
    admin: ['approve', 'reject', 'supplement', 'reassign', 'pay', 'confirm_parking', 'park', 'reconcile', 'cancel']
  };

  const allowedActions = roleActionMap[userRole] || [];
  return statusConfig.actions.filter(action => allowedActions.includes(action));
};

const calculateDuration = (startTime, endTime) => {
  const start = dayjs(startTime);
  const end = endTime ? dayjs(endTime) : dayjs();
  return end.diff(start, 'minute');
};

const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}小时${mins}分钟`;
  }
  return `${mins}分钟`;
};

const formatAmount = (amount) => {
  return Number(amount).toFixed(2);
};

const isNightTime = (time, nightStart = '22:00', nightEnd = '06:00') => {
  const [startHour, startMin] = nightStart.split(':').map(Number);
  const [endHour, endMin] = nightEnd.split(':').map(Number);
  
  const timeObj = dayjs(time);
  const hour = timeObj.hour();
  const minute = timeObj.minute();

  if (startHour > endHour) {
    if (hour > startHour || (hour === startHour && minute >= startMin)) {
      return true;
    }
    if (hour < endHour || (hour === endHour && minute < endMin)) {
      return true;
    }
  } else {
    if ((hour > startHour || (hour === startHour && minute >= startMin)) &&
        (hour < endHour || (hour === endHour && minute < endMin))) {
      return true;
    }
  }
  
  return false;
};

const buildQueryFilters = (query, allowedFields = []) => {
  const conditions = [];
  const values = [];

  allowedFields.forEach(field => {
    if (query[field] !== undefined && query[field] !== '') {
      if (typeof query[field] === 'string' && query[field].includes('%')) {
        conditions.push(`${field} LIKE ?`);
        values.push(query[field]);
      } else {
        conditions.push(`${field} = ?`);
        values.push(query[field]);
      }
    }
  });

  return { conditions, values };
};

const buildPagination = (query) => {
  const page = parseInt(query.page) || 1;
  const pageSize = parseInt(query.pageSize) || 10;
  const offset = (page - 1) * pageSize;
  
  return { page, pageSize, offset, limit: pageSize };
};

const checkConcurrency = (db, tableName, id, expectedVersion) => {
  const record = db.prepare(`SELECT version FROM ${tableName} WHERE id = ?`).get(id);
  if (!record) return { success: false, message: '记录不存在' };
  if (record.version !== expectedVersion) {
    return { success: false, message: '记录已被其他用户修改，请刷新后重试' };
  }
  return { success: true };
};

module.exports = {
  generateOrderNo,
  generatePaymentNo,
  generateCardNo,
  STATUS_FLOW,
  validateStatusTransition,
  getStatusName,
  getAvailableActions,
  calculateDuration,
  formatDuration,
  formatAmount,
  isNightTime,
  buildQueryFilters,
  buildPagination,
  checkConcurrency
};