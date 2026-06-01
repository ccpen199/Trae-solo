export const ORDER_STATUS = {
  PENDING_AUDIT: 'pending_audit',
  AUDIT_REJECTED: 'audit_rejected',
  PENDING_DISPATCH: 'pending_dispatch',
  DISPATCHED: 'dispatched',
  NURSE_ACCEPTED: 'nurse_accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING_AUDIT]: '待审核',
  [ORDER_STATUS.AUDIT_REJECTED]: '审核未通过',
  [ORDER_STATUS.PENDING_DISPATCH]: '待派单',
  [ORDER_STATUS.DISPATCHED]: '已派单',
  [ORDER_STATUS.NURSE_ACCEPTED]: '护士已接单',
  [ORDER_STATUS.IN_PROGRESS]: '服务中',
  [ORDER_STATUS.COMPLETED]: '已完成',
  [ORDER_STATUS.CANCELLED]: '已取消'
}

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING_AUDIT]: 'orange',
  [ORDER_STATUS.AUDIT_REJECTED]: 'red',
  [ORDER_STATUS.PENDING_DISPATCH]: 'gold',
  [ORDER_STATUS.DISPATCHED]: 'blue',
  [ORDER_STATUS.NURSE_ACCEPTED]: 'cyan',
  [ORDER_STATUS.IN_PROGRESS]: 'processing',
  [ORDER_STATUS.COMPLETED]: 'green',
  [ORDER_STATUS.CANCELLED]: 'default'
}

export const RISK_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
}

export const RISK_LEVEL_LABELS = {
  [RISK_LEVEL.LOW]: '低风险',
  [RISK_LEVEL.MEDIUM]: '中风险',
  [RISK_LEVEL.HIGH]: '高风险'
}

export const RISK_LEVEL_COLORS = {
  [RISK_LEVEL.LOW]: 'green',
  [RISK_LEVEL.MEDIUM]: 'orange',
  [RISK_LEVEL.HIGH]: 'red'
}

export const USER_ROLES = {
  PATIENT_FAMILY: 'patient_family',
  NURSE: 'nurse',
  DISPATCHER: 'dispatcher',
  ADMIN: 'admin'
}

export const USER_ROLES_LABELS = {
  [USER_ROLES.PATIENT_FAMILY]: '患者家属',
  [USER_ROLES.NURSE]: '护士',
  [USER_ROLES.DISPATCHER]: '调度员',
  [USER_ROLES.ADMIN]: '机构管理员'
}

export const SERVICE_CATEGORIES = [
  { value: 'nursing_care', label: '基础护理' },
  { value: 'wound_care', label: '伤口护理' },
  { value: 'medication', label: '用药指导' },
  { value: 'rehabilitation', label: '康复训练' },
  { value: 'palliative', label: '安宁疗护' },
  { value: 'health_check', label: '健康体检' }
]
