export const STATUS_MAP = {
  DRAFT: { label: '草稿', color: 'default' },
  PENDING_APPROVAL: { label: '待审批', color: 'warning' },
  APPROVED: { label: '已批准', color: 'success' },
  REJECTED: { label: '已驳回', color: 'error' },
  PENDING_SUPPLEMENT: { label: '待补充', color: 'warning' },
  IN_PROGRESS: { label: '处理中', color: 'processing' },
  COMPLETED: { label: '已完成', color: 'success' },
  RELEASED: { label: '已放行', color: 'success' },
  PENDING_ARRIVAL: { label: '待进场', color: 'warning' },
  ARRIVED: { label: '已进场', color: 'success' },
  ARRIVED_AT_GATE: { label: '到达闸口', color: 'processing' },
  IN_YARD: { label: '在堆场', color: 'success' },
  PENDING: { label: '待处理', color: 'warning' },
  SCHEDULED: { label: '已预约', color: 'default' },
  CHECKED_IN: { label: '已入场', color: 'success' },
  CHECKED_OUT: { label: '已出场', color: 'success' },
  AVAILABLE: { label: '可用', color: 'success' },
  OCCUPIED: { label: '已占用', color: 'warning' },
  LOCKED: { label: '已锁定', color: 'error' },
  UNREAD: { label: '未读', color: 'warning' },
  READ: { label: '已读', color: 'default' },
};

export const ROLE_MAP = {
  DISPATCHER: { label: '码头调度员', color: 'blue' },
  YARD_WORKER: { label: '堆场员', color: 'green' },
  DRIVER: { label: '司机', color: 'orange' },
  ADMIN: { label: '管理员', color: 'purple' },
  AUDITOR: { label: '审计员', color: 'cyan' },
};

export const TASK_TYPE_MAP = {
  LOADING: { label: '装卸作业', color: 'blue' },
  UNLOADING: { label: '卸船作业', color: 'green' },
  YARD_MOVE: { label: '堆场移箱', color: 'orange' },
  GATE_IN: { label: '闸口进场', color: 'purple' },
  GATE_OUT: { label: '闸口出场', color: 'cyan' },
};

export const EXCEPTION_TYPE_MAP = {
  LOCATION_DRIFT: { label: '定位漂移', color: 'red' },
  ROUTE_DEVIATION: { label: '路线偏离', color: 'orange' },
  DRIVER_REJECT: { label: '司机拒接', color: 'yellow' },
  ARRIVAL_UNCONFIRMED: { label: '到达未确认', color: 'blue' },
  MAP_CALLBACK_DELAY: { label: '地图回调延迟', color: 'purple' },
};

export const CONTAINER_SIZE_TYPES = [
  { value: '20GP', label: '20尺普箱' },
  { value: '20HC', label: '20尺高箱' },
  { value: '40GP', label: '40尺普箱' },
  { value: '40HC', label: '40尺高箱' },
  { value: '40HQ', label: '40尺超高箱' },
  { value: '45HC', label: '45尺高箱' },
];

export const PRIORITY_OPTIONS = [
  { value: 'LOW', label: '低' },
  { value: 'NORMAL', label: '普通' },
  { value: 'HIGH', label: '高' },
  { value: 'URGENT', label: '紧急' },
];

export const GATE_OPTIONS = [
  { value: 'G01', label: '1号闸口' },
  { value: 'G02', label: '2号闸口' },
  { value: 'G03', label: '3号闸口' },
  { value: 'G04', label: '4号闸口' },
  { value: 'G05', label: '5号闸口' },
];

export const WORKFLOW_NODES = [
  { key: 'VESSEL_PLAN', label: '船舶计划', description: '创建船舶计划，分配集装箱' },
  { key: 'CONTAINER_ARRIVAL', label: '集装箱进场', description: '集装箱到达闸口，审核进场' },
  { key: 'YARD_ALLOCATION', label: '堆场分配', description: '根据规则分配堆场位置' },
  { key: 'LOADING_OPERATION', label: '装卸作业', description: '锁定闸口，执行装卸作业' },
  { key: 'RELEASE', label: '出场放行', description: '更新状态，通知相关角色' },
];

export const getStatusLabel = (status) => {
  return STATUS_MAP[status]?.label || status;
};

export const getStatusColor = (status) => {
  return STATUS_MAP[status]?.color || 'default';
};

export const getRoleLabel = (role) => {
  return ROLE_MAP[role]?.label || role;
};

export const getTaskTypeLabel = (type) => {
  return TASK_TYPE_MAP[type]?.label || type;
};

export const getExceptionTypeLabel = (type) => {
  return EXCEPTION_TYPE_MAP[type]?.label || type;
};
