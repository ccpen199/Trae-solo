export const STATUS = {
  PENDING_MODEL_LOAD: 'pending_model_load',
  PENDING_INTERACTION: 'pending_interaction',
  PENDING_CONFIG_SELECTION: 'pending_config_selection',
  PENDING_QUOTE: 'pending_quote',
  PENDING_LEAD: 'pending_lead',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
  REJECTED: 'rejected',
  DEGRADED: 'degraded'
}

export const STATUS_LABEL = {
  [STATUS.PENDING_MODEL_LOAD]: '待加载模型',
  [STATUS.PENDING_INTERACTION]: '待交互查看',
  [STATUS.PENDING_CONFIG_SELECTION]: '待选择配置',
  [STATUS.PENDING_QUOTE]: '待生成报价',
  [STATUS.PENDING_LEAD]: '待留资',
  [STATUS.COMPLETED]: '已完成',
  [STATUS.ARCHIVED]: '已归档',
  [STATUS.REJECTED]: '已驳回',
  [STATUS.DEGRADED]: '已降级'
}

export const STATUS_COLOR = {
  [STATUS.PENDING_MODEL_LOAD]: 'info',
  [STATUS.PENDING_INTERACTION]: 'warning',
  [STATUS.PENDING_CONFIG_SELECTION]: 'primary',
  [STATUS.PENDING_QUOTE]: 'warning',
  [STATUS.PENDING_LEAD]: 'primary',
  [STATUS.COMPLETED]: 'success',
  [STATUS.ARCHIVED]: 'info',
  [STATUS.REJECTED]: 'danger',
  [STATUS.DEGRADED]: 'danger'
}

export const STATUS_ICON = {
  [STATUS.PENDING_MODEL_LOAD]: 'Upload',
  [STATUS.PENDING_INTERACTION]: 'View',
  [STATUS.PENDING_CONFIG_SELECTION]: 'Setting',
  [STATUS.PENDING_QUOTE]: 'Money',
  [STATUS.PENDING_LEAD]: 'User',
  [STATUS.COMPLETED]: 'CircleCheck',
  [STATUS.ARCHIVED]: 'Box',
  [STATUS.REJECTED]: 'CircleClose',
  [STATUS.DEGRADED]: 'Warning'
}

export const ROLES = {
  CONSUMER: 'consumer',
  DESIGNER: 'designer',
  OPERATOR: 'operator',
  SALES: 'sales'
}

export const ROLE_LABEL = {
  [ROLES.CONSUMER]: '消费者',
  [ROLES.DESIGNER]: '设计师',
  [ROLES.OPERATOR]: '运营',
  [ROLES.SALES]: '销售'
}

export const ROLE_COLOR = {
  [ROLES.CONSUMER]: 'info',
  [ROLES.DESIGNER]: 'primary',
  [ROLES.OPERATOR]: 'success',
  [ROLES.SALES]: 'warning'
}

export const ACTIONS = {
  SUBMIT_MODEL: 'submit_model',
  APPROVE: 'approve',
  REJECT: 'reject',
  SUPPLEMENT: 'supplement',
  TRANSFER: 'transfer',
  SELECT_CONFIG: 'select_config',
  GENERATE_QUOTE: 'generate_quote',
  SUBMIT_LEAD: 'submit_lead',
  CANCEL: 'cancel',
  REVERT: 'revert'
}

export const ACTION_LABEL = {
  [ACTIONS.SUBMIT_MODEL]: '提交模型',
  [ACTIONS.APPROVE]: '审核通过',
  [ACTIONS.REJECT]: '驳回',
  [ACTIONS.SUPPLEMENT]: '要求补充资料',
  [ACTIONS.TRANSFER]: '转派',
  [ACTIONS.SELECT_CONFIG]: '选择配置',
  [ACTIONS.GENERATE_QUOTE]: '生成报价',
  [ACTIONS.SUBMIT_LEAD]: '提交留资',
  [ACTIONS.CANCEL]: '取消',
  [ACTIONS.REVERT]: '撤销'
}

export const ACTION_TYPE = {
  [ACTIONS.APPROVE]: 'primary',
  [ACTIONS.REJECT]: 'danger',
  [ACTIONS.CANCEL]: 'danger',
  [ACTIONS.SUBMIT_MODEL]: 'success',
  [ACTIONS.SUBMIT_LEAD]: 'success',
  default: 'info'
}

export const MODEL_TYPES = [
  { value: 'furniture', label: '家具' },
  { value: 'car', label: '汽车' },
  { value: 'equipment', label: '设备' }
]

export const MATERIAL_TYPES = [
  { value: 'wood', label: '木材' },
  { value: 'leather', label: '皮革' },
  { value: 'fabric', label: '布料' },
  { value: 'metal', label: '金属' },
  { value: 'glass', label: '玻璃' },
  { value: 'plastic', label: '塑料' },
  { value: 'carbon_fiber', label: '碳纤维' },
  { value: 'rubber', label: '橡胶' }
]

export const EVENT_TYPES = {
  create: '创建',
  approval: '审批',
  rejection: '驳回',
  supplement_request: '补充要求',
  transfer: '转派',
  config_select: '配置选择',
  quote_generate: '报价生成',
  lead_submit: '留资提交',
  cancel: '取消',
  revert: '撤销',
  archive: '归档',
  supplement: '补录',
  reopen: '重开'
}
