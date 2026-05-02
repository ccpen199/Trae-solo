export const DeclarationStatus = {
  DRAFT: 'DRAFT',
  PENDING_DATA_ENTRY: 'PENDING_DATA_ENTRY',
  PENDING_CLASSIFICATION: 'PENDING_CLASSIFICATION',
  PENDING_DECLARATION: 'PENDING_DECLARATION',
  PENDING_INSPECTION_TAX: 'PENDING_INSPECTION_TAX',
  RELEASED_ARCHIVED: 'RELEASED_ARCHIVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  EXCEPTION: 'EXCEPTION',
}

export const StatusFlow = {
  [DeclarationStatus.PENDING_DATA_ENTRY]: {
    allowedActions: ['SUBMIT_FOR_CLASSIFICATION', 'SAVE_DRAFT', 'CANCEL'],
    nextStatus: DeclarationStatus.PENDING_CLASSIFICATION,
  },
  [DeclarationStatus.PENDING_CLASSIFICATION]: {
    allowedActions: ['CLASSIFY', 'REJECT', 'REASSIGN', 'SUPPLEMENT'],
    nextStatus: DeclarationStatus.PENDING_DECLARATION,
  },
  [DeclarationStatus.PENDING_DECLARATION]: {
    allowedActions: ['DECLARE', 'LOCK', 'UNLOCK', 'REJECT', 'SUPPLEMENT'],
    nextStatus: DeclarationStatus.PENDING_INSPECTION_TAX,
  },
  [DeclarationStatus.PENDING_INSPECTION_TAX]: {
    allowedActions: ['INSPECT', 'PAY_TAX', 'REJECT', 'SUPPLEMENT'],
    nextStatus: DeclarationStatus.RELEASED_ARCHIVED,
  },
  [DeclarationStatus.RELEASED_ARCHIVED]: {
    allowedActions: ['ARCHIVE', 'VIEW'],
    nextStatus: null,
  },
  [DeclarationStatus.REJECTED]: {
    allowedActions: ['SUPPLEMENT', 'CANCEL', 'RESUBMIT'],
    nextStatus: DeclarationStatus.PENDING_DATA_ENTRY,
  },
  [DeclarationStatus.CANCELLED]: {
    allowedActions: ['VIEW'],
    nextStatus: null,
  },
  [DeclarationStatus.EXCEPTION]: {
    allowedActions: ['RESOLVE', 'REASSIGN', 'ESCALATE'],
    nextStatus: DeclarationStatus.PENDING_DATA_ENTRY,
  },
}

export const ActionToStatus = {
  SUBMIT_FOR_CLASSIFICATION: DeclarationStatus.PENDING_CLASSIFICATION,
  CLASSIFY: DeclarationStatus.PENDING_DECLARATION,
  DECLARE: DeclarationStatus.PENDING_INSPECTION_TAX,
  INSPECT: DeclarationStatus.RELEASED_ARCHIVED,
  PAY_TAX: DeclarationStatus.RELEASED_ARCHIVED,
  REJECT: DeclarationStatus.REJECTED,
  CANCEL: DeclarationStatus.CANCELLED,
  SUPPLEMENT: DeclarationStatus.PENDING_DATA_ENTRY,
  RESUBMIT: DeclarationStatus.PENDING_DATA_ENTRY,
  RESOLVE: DeclarationStatus.PENDING_DATA_ENTRY,
}

export const UserRole = {
  DECLARANT: 'DECLARANT',
  CARGO_OWNER: 'CARGO_OWNER',
  CUSTOMS: 'CUSTOMS',
  FORWARDER: 'FORWARDER',
  TAX: 'TAX',
  ADMIN: 'ADMIN',
}

export const RolePermissions = {
  [UserRole.DECLARANT]: {
    canCreate: true,
    canEdit: ['PENDING_DATA_ENTRY', 'PENDING_CLASSIFICATION'],
    canSubmit: true,
    canView: true,
  },
  [UserRole.CARGO_OWNER]: {
    canCreate: false,
    canEdit: [],
    canSubmit: false,
    canView: true,
  },
  [UserRole.CUSTOMS]: {
    canCreate: false,
    canEdit: ['PENDING_DECLARATION', 'PENDING_INSPECTION_TAX'],
    canSubmit: true,
    canView: true,
    canApprove: true,
    canInspect: true,
  },
  [UserRole.FORWARDER]: {
    canCreate: true,
    canEdit: ['PENDING_DATA_ENTRY', 'PENDING_CLASSIFICATION'],
    canSubmit: true,
    canView: true,
  },
  [UserRole.TAX]: {
    canCreate: false,
    canEdit: ['PENDING_INSPECTION_TAX'],
    canSubmit: true,
    canView: true,
    canApproveTax: true,
  },
  [UserRole.ADMIN]: {
    canCreate: true,
    canEdit: ['*'],
    canSubmit: true,
    canView: true,
    canApprove: true,
    canDelete: true,
    canReassign: true,
  },
}

export const StatusDisplayNames = {
  [DeclarationStatus.DRAFT]: '草稿',
  [DeclarationStatus.PENDING_DATA_ENTRY]: '待资料录入',
  [DeclarationStatus.PENDING_CLASSIFICATION]: '待商品归类',
  [DeclarationStatus.PENDING_DECLARATION]: '待申报',
  [DeclarationStatus.PENDING_INSPECTION_TAX]: '待查验缴税',
  [DeclarationStatus.RELEASED_ARCHIVED]: '放行归档',
  [DeclarationStatus.REJECTED]: '已驳回',
  [DeclarationStatus.CANCELLED]: '已撤销',
  [DeclarationStatus.EXCEPTION]: '异常',
}

export const ActionDisplayNames = {
  SUBMIT_FOR_CLASSIFICATION: '提交归类',
  CLASSIFY: '完成归类',
  DECLARE: '申报',
  INSPECT: '完成查验',
  PAY_TAX: '完成缴税',
  REJECT: '驳回',
  CANCEL: '撤销',
  SAVE_DRAFT: '保存草稿',
  SUPPLEMENT: '补充资料',
  RESUBMIT: '重新提交',
  LOCK: '锁定',
  UNLOCK: '解锁',
  REASSIGN: '转派',
  RESOLVE: '解决异常',
  ESCALATE: '升级',
  ARCHIVE: '归档',
  VIEW: '查看',
}
