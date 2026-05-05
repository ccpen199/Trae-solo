export const STATUS_MAP = {
  draft: { label: '草稿', color: 'default' },
  submitted: { label: '已提交', color: 'processing' },
  approving: { label: '业务员审核中', color: 'processing' },
  reviewing: { label: '财务审核中', color: 'processing' },
  approved: { label: '审批通过', color: 'success' },
  archived: { label: '已归档', color: 'success' },
  approver_rejected: { label: '业务员驳回', color: 'error' },
  finance_rejected: { label: '财务驳回', color: 'error' },
};

export const STEP_MAP = {
  submit: { label: '提交申请', order: 1 },
  approver: { label: '业务员审批', order: 2 },
  finance: { label: '财务复核', order: 3 },
  complete: { label: '完成', order: 4 },
  rejected: { label: '驳回', order: 0 },
};

export const ROLE_MAP = {
  employee: { label: '员工', chinese: '员工' },
  approver: { label: '业务员审批', chinese: '审批人' },
  finance: { label: '财务复核', chinese: '财务' },
  admin: { label: '管理员', chinese: '管理员' },
};

export const getStatusLabel = (status) => {
  return STATUS_MAP[status]?.label || status;
};

export const getStatusColor = (status) => {
  return STATUS_MAP[status]?.color || 'default';
};

export const isRejected = (status) => {
  return ['approver_rejected', 'finance_rejected'].includes(status);
};

export const isEditable = (status) => {
  return ['draft', 'approver_rejected', 'finance_rejected'].includes(status);
};

export const isApproving = (status) => {
  return ['submitted', 'approving', 'reviewing'].includes(status);
};
