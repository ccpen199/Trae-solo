import dayjs from 'dayjs'

export const WORKFLOW_NODES = {
  CREATE_COLLECTION: 'CREATE_COLLECTION',
  WAITING_PAYMENT: 'WAITING_PAYMENT',
  EXCHANGE_RATE: 'EXCHANGE_RATE',
  COMPLIANCE_AUDIT: 'COMPLIANCE_AUDIT',
  WAITING_SETTLEMENT: 'WAITING_SETTLEMENT',
  SETTLEMENT_COMPLETED: 'SETTLEMENT_COMPLETED',
  EXCEPTION_HANDLE: 'EXCEPTION_HANDLE',
}

export const NODE_NAMES = {
  CREATE_COLLECTION: '创建收款',
  WAITING_PAYMENT: '待支付',
  EXCHANGE_RATE: '汇率换算',
  COMPLIANCE_AUDIT: '合规审核',
  WAITING_SETTLEMENT: '待结算',
  SETTLEMENT_COMPLETED: '结算完成',
  EXCEPTION_HANDLE: '异常处理',
}

export const TRANSACTION_STATUSES = {
  CREATED: 'CREATED',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAYMENT_PROCESSING: 'PAYMENT_PROCESSING',
  PAYMENT_COMPLETED: 'PAYMENT_COMPLETED',
  EXCHANGE_PROCESSING: 'EXCHANGE_PROCESSING',
  EXCHANGE_COMPLETED: 'EXCHANGE_COMPLETED',
  PENDING_COMPLIANCE: 'PENDING_COMPLIANCE',
  COMPLIANCE_APPROVED: 'COMPLIANCE_APPROVED',
  COMPLIANCE_REJECTED: 'COMPLIANCE_REJECTED',
  PENDING_SETTLEMENT: 'PENDING_SETTLEMENT',
  SETTLEMENT_PROCESSING: 'SETTLEMENT_PROCESSING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXCEPTION: 'EXCEPTION',
}

export const STATUS_NAMES = {
  CREATED: '已创建',
  PENDING_PAYMENT: '待支付',
  PAYMENT_PROCESSING: '支付处理中',
  PAYMENT_COMPLETED: '支付完成',
  EXCHANGE_PROCESSING: '汇率处理中',
  EXCHANGE_COMPLETED: '汇率换算完成',
  PENDING_COMPLIANCE: '待合规审核',
  COMPLIANCE_APPROVED: '合规通过',
  COMPLIANCE_REJECTED: '合规驳回',
  PENDING_SETTLEMENT: '待结算',
  SETTLEMENT_PROCESSING: '结算处理中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  EXCEPTION: '异常',
}

export const STATUS_COLORS = {
  CREATED: 'default',
  PENDING_PAYMENT: 'blue',
  PAYMENT_PROCESSING: 'processing',
  PAYMENT_COMPLETED: 'cyan',
  EXCHANGE_PROCESSING: 'processing',
  EXCHANGE_COMPLETED: 'cyan',
  PENDING_COMPLIANCE: 'orange',
  COMPLIANCE_APPROVED: 'green',
  COMPLIANCE_REJECTED: 'red',
  PENDING_SETTLEMENT: 'gold',
  SETTLEMENT_PROCESSING: 'processing',
  COMPLETED: 'success',
  CANCELLED: 'default',
  EXCEPTION: 'error',
}

export const CURRENCIES = [
  { code: 'CNY', name: '人民币', symbol: '¥' },
  { code: 'USD', name: '美元', symbol: '$' },
  { code: 'EUR', name: '欧元', symbol: '€' },
  { code: 'GBP', name: '英镑', symbol: '£' },
  { code: 'JPY', name: '日元', symbol: '¥' },
  { code: 'AUD', name: '澳元', symbol: 'A$' },
  { code: 'HKD', name: '港币', symbol: 'HK$' },
  { code: 'SGD', name: '新加坡元', symbol: 'S$' },
]

export const ROLE_NAMES = {
  MERCHANT: '商户操作员',
  MERCHANT_ADMIN: '商户管理员',
  BUYER: '买家',
  PAYMENT_INSTITUTION: '支付机构',
  BANK: '银行',
  COMPLIANCE: '合规审核员',
  FINANCE: '财务人员',
  ADMIN: '系统管理员',
}

export const NODE_ACTIONS = {
  CREATE_COLLECTION: ['save', 'submit', 'cancel'],
  WAITING_PAYMENT: ['lock_rate', 'process_payment', 'cancel'],
  EXCHANGE_RATE: ['convert', 'manual_adjust'],
  COMPLIANCE_AUDIT: ['approve', 'reject', 'request_more', 'reassign'],
  WAITING_SETTLEMENT: ['process_settlement', 'cancel'],
  EXCEPTION_HANDLE: ['retry_payment', 'retry_exchange', 'retry_compliance', 'retry_settlement', 'cancel'],
}

export const ACTION_NAMES = {
  save: '保存',
  submit: '提交',
  cancel: '取消',
  lock_rate: '锁定汇率',
  process_payment: '处理支付',
  convert: '汇率换算',
  manual_adjust: '手动调整',
  approve: '通过',
  reject: '驳回',
  request_more: '要求补充资料',
  reassign: '转派',
  process_settlement: '处理结算',
  retry_payment: '重试支付',
  retry_exchange: '重试汇率换算',
  retry_compliance: '重试合规审核',
  retry_settlement: '重试结算',
}

export function formatCurrency(amount, currency = 'CNY') {
  if (amount === null || amount === undefined) return '-'
  const symbol = CURRENCIES.find(c => c.code === currency)?.symbol || ''
  return `${symbol}${Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export function formatDateShort(date) {
  return formatDate(date, 'YYYY-MM-DD')
}

export function getStatusTag(status) {
  return {
    text: STATUS_NAMES[status] || status,
    color: STATUS_COLORS[status] || 'default',
  }
}

export function getNodeName(node) {
  return NODE_NAMES[node] || node
}

export function getRoleName(role) {
  return ROLE_NAMES[role] || role
}
