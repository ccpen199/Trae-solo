const STATUS_MAP = {
  'draft': { label: '草稿', color: 'default' },
  'returned_for_edit': { label: '退回修改', color: 'warning' },
  'submitted': { label: '已提交', color: 'blue' },
  'fraud_checking': { label: '欺诈检测中', color: 'orange' },
  'pending_initial_review': { label: '待初审', color: 'blue' },
  'manager_processing': { label: '经理处理中', color: 'processing' },
  'pending_risk_review': { label: '待风控审核', color: 'orange' },
  'risk_reviewing': { label: '风控审核中', color: 'processing' },
  'pending_approval': { label: '待最终审批', color: 'gold' },
  'approval_in_progress': { label: '审批中', color: 'processing' },
  'multi_signing': { label: '多级会签中', color: 'purple' },
  'approved': { label: '已批准', color: 'success' },
  'lending': { label: '放款中', color: 'blue' },
  'awaiting_confirmation': { label: '待借款人确认', color: 'warning' },
  'active': { label: '还款中', color: 'success' },
  'repaid': { label: '已结清', color: 'success' },
  'overdue': { label: '已逾期', color: 'error' },
  'rejected': { label: '已拒绝', color: 'error' },
  'cancelled': { label: '已取消', color: 'default' }
};

const getStatusInfo = (status) => {
  return STATUS_MAP[status] || { label: status, color: 'default' };
};

const FRAUD_RISK_MAP = {
  'low': { label: '低风险', color: 'success' },
  'medium': { label: '中风险', color: 'warning' },
  'high': { label: '高风险', color: 'orange' },
  'critical': { label: '极高风险', color: 'error' }
};

const getFraudRiskInfo = (level) => {
  return FRAUD_RISK_MAP[level] || { label: level, color: 'default' };
};

const REPAYMENT_STATUS_MAP = {
  'pending': { label: '待还款', color: 'default' },
  'paid': { label: '已还款', color: 'success' },
  'overdue': { label: '已逾期', color: 'error' },
  'partially_paid': { label: '部分还款', color: 'warning' }
};

const getRepaymentStatusInfo = (status) => {
  return REPAYMENT_STATUS_MAP[status] || { label: status, color: 'default' };
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(amount || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
};

export {
  getStatusInfo,
  getFraudRiskInfo,
  getRepaymentStatusInfo,
  formatCurrency,
  formatDate,
  formatDateTime
};
