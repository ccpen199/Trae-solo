export const STEPS = {
  ORG_SYNC: 'org_sync',
  CHAT_COMMUNICATION: 'chat_communication',
  FILE_SEND: 'file_send',
  TASK_NOTIFICATION: 'task_notification',
  ARCHIVE: 'archive',
};

export const STEP_NAMES = {
  [STEPS.ORG_SYNC]: '组织同步',
  [STEPS.CHAT_COMMUNICATION]: '聊天沟通',
  [STEPS.FILE_SEND]: '文件发送',
  [STEPS.TASK_NOTIFICATION]: '任务通知',
  [STEPS.ARCHIVE]: '归档',
};

export const STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PROCESSING: 'processing',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NEED_SUPPLEMENT: 'need_supplement',
  TRANSFERRED: 'transferred',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
  TIMEOUT: 'timeout',
  CANCELLED: 'cancelled',
};

export const STATUS_NAMES = {
  [STATUS.DRAFT]: '草稿',
  [STATUS.PENDING]: '待处理',
  [STATUS.PROCESSING]: '处理中',
  [STATUS.APPROVED]: '已通过',
  [STATUS.REJECTED]: '已驳回',
  [STATUS.NEED_SUPPLEMENT]: '需补充',
  [STATUS.TRANSFERRED]: '已转派',
  [STATUS.COMPLETED]: '已完成',
  [STATUS.ARCHIVED]: '已归档',
  [STATUS.TIMEOUT]: '已超时',
  [STATUS.CANCELLED]: '已取消',
};

export const STATUS_COLORS = {
  [STATUS.DRAFT]: 'default',
  [STATUS.PENDING]: 'warning',
  [STATUS.PROCESSING]: 'processing',
  [STATUS.APPROVED]: 'success',
  [STATUS.REJECTED]: 'error',
  [STATUS.NEED_SUPPLEMENT]: 'warning',
  [STATUS.TRANSFERRED]: 'default',
  [STATUS.COMPLETED]: 'success',
  [STATUS.ARCHIVED]: 'success',
  [STATUS.TIMEOUT]: 'error',
  [STATUS.CANCELLED]: 'default',
};

export const ORDER_TYPES = {
  ORG_SYNC: 'org_sync',
  CHAT: 'chat',
  FILE: 'file',
  ANNOUNCEMENT: 'announcement',
};

export const ORDER_TYPE_NAMES = {
  [ORDER_TYPES.ORG_SYNC]: '组织同步',
  [ORDER_TYPES.CHAT]: '聊天沟通',
  [ORDER_TYPES.FILE]: '文件发送',
  [ORDER_TYPES.ANNOUNCEMENT]: '公告发布',
};

export const PRIORITY = {
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
};

export const PRIORITY_NAMES = {
  [PRIORITY.HIGH]: '高',
  [PRIORITY.NORMAL]: '中',
  [PRIORITY.LOW]: '低',
};

export const PRIORITY_COLORS = {
  [PRIORITY.HIGH]: 'red',
  [PRIORITY.NORMAL]: 'orange',
  [PRIORITY.LOW]: 'blue',
};

export const ROLES = {
  ADMIN: 'admin',
  DEPT_LEADER: 'dept_leader',
  EMPLOYEE: 'employee',
};

export const NOTIFICATION_TYPES = {
  TODO: 'todo',
  SYSTEM: 'system',
  MESSAGE: 'message',
  ANNOUNCEMENT: 'announcement',
};

export const NOTIFICATION_TYPE_NAMES = {
  [NOTIFICATION_TYPES.TODO]: '待办通知',
  [NOTIFICATION_TYPES.SYSTEM]: '系统通知',
  [NOTIFICATION_TYPES.MESSAGE]: '消息通知',
  [NOTIFICATION_TYPES.ANNOUNCEMENT]: '公告通知',
};
