export const BOOKING_STATUSES = {
  PENDING_BOOKING: 'PENDING_BOOKING',
  PENDING_CONTAINER: 'PENDING_CONTAINER',
  PENDING_PORT_ENTRY: 'PENDING_PORT_ENTRY',
  PENDING_LOADING: 'PENDING_LOADING',
  PENDING_BILL_RELEASE: 'PENDING_BILL_RELEASE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
}

export const STATUS_LABELS = {
  [BOOKING_STATUSES.PENDING_BOOKING]: '待询价订舱',
  [BOOKING_STATUSES.PENDING_CONTAINER]: '待箱号分配',
  [BOOKING_STATUSES.PENDING_PORT_ENTRY]: '待港口进场',
  [BOOKING_STATUSES.PENDING_LOADING]: '待装船',
  [BOOKING_STATUSES.PENDING_BILL_RELEASE]: '待提单放单',
  [BOOKING_STATUSES.COMPLETED]: '已完成',
  [BOOKING_STATUSES.CANCELLED]: '已撤销',
  [BOOKING_STATUSES.REJECTED]: '已驳回',
}

export const STATUS_TYPES = {
  [BOOKING_STATUSES.PENDING_BOOKING]: 'warning',
  [BOOKING_STATUSES.PENDING_CONTAINER]: 'warning',
  [BOOKING_STATUSES.PENDING_PORT_ENTRY]: 'warning',
  [BOOKING_STATUSES.PENDING_LOADING]: 'warning',
  [BOOKING_STATUSES.PENDING_BILL_RELEASE]: 'warning',
  [BOOKING_STATUSES.COMPLETED]: 'success',
  [BOOKING_STATUSES.CANCELLED]: 'info',
  [BOOKING_STATUSES.REJECTED]: 'danger',
}

export const STATUS_TRANSITIONS = {
  [BOOKING_STATUSES.PENDING_BOOKING]: [
    {
      action: 'SUBMIT_BOOKING',
      label: '提交订舱',
      allowed: true,
      nextStatus: BOOKING_STATUSES.PENDING_CONTAINER,
    },
  ],
  [BOOKING_STATUSES.PENDING_CONTAINER]: [
    {
      action: 'ASSIGN_CONTAINER',
      label: '分配箱号',
      allowed: true,
      nextStatus: BOOKING_STATUSES.PENDING_PORT_ENTRY,
    },
  ],
  [BOOKING_STATUSES.PENDING_PORT_ENTRY]: [
    {
      action: 'PORT_ENTRY',
      label: '港口进场',
      allowed: true,
      nextStatus: BOOKING_STATUSES.PENDING_LOADING,
    },
  ],
  [BOOKING_STATUSES.PENDING_LOADING]: [
    {
      action: 'LOADING',
      label: '执行装船',
      allowed: true,
      nextStatus: BOOKING_STATUSES.PENDING_BILL_RELEASE,
    },
  ],
  [BOOKING_STATUSES.PENDING_BILL_RELEASE]: [
    {
      action: 'RELEASE_BOL',
      label: '提单放单',
      allowed: true,
      nextStatus: BOOKING_STATUSES.COMPLETED,
    },
  ],
}

export const ROLES = {
  CONSIGNOR: 'CONSIGNOR',
  FORWARDER: 'FORWARDER',
  SHIPPING_COMPANY: 'SHIPPING_COMPANY',
  PORT: 'PORT',
  CUSTOMS_BROKER: 'CUSTOMS_BROKER',
}

export const ROLE_LABELS = {
  [ROLES.CONSIGNOR]: '货主',
  [ROLES.FORWARDER]: '货代',
  [ROLES.SHIPPING_COMPANY]: '船公司',
  [ROLES.PORT]: '港口',
  [ROLES.CUSTOMS_BROKER]: '报关行',
}

export const ROLE_TAGS = {
  [ROLES.CONSIGNOR]: { type: 'primary', text: '货主' },
  [ROLES.FORWARDER]: { type: 'success', text: '货代' },
  [ROLES.SHIPPING_COMPANY]: { type: 'warning', text: '船公司' },
  [ROLES.PORT]: { type: 'danger', text: '港口' },
  [ROLES.CUSTOMS_BROKER]: { type: 'info', text: '报关行' },
}

export const CONTAINER_TYPES = [
  { code: '20GP', name: '20英尺普通柜' },
  { code: '40GP', name: '40英尺普通柜' },
  { code: '40HQ', name: '40英尺高柜' },
  { code: '20RF', name: '20英尺冷冻柜' },
  { code: '40RF', name: '40英尺冷冻柜' },
  { code: '20OT', name: '20英尺开顶柜' },
  { code: '40OT', name: '40英尺开顶柜' },
  { code: '20FR', name: '20英尺框架柜' },
  { code: '40FR', name: '40英尺框架柜' },
  { code: '20TK', name: '20英尺罐式柜' },
  { code: '40TK', name: '40英尺罐式柜' },
]

export const WORKFLOW_STEPS = [
  { status: BOOKING_STATUSES.PENDING_BOOKING, name: '询价订舱', icon: 'Document' },
  { status: BOOKING_STATUSES.PENDING_CONTAINER, name: '箱号分配', icon: 'Box' },
  { status: BOOKING_STATUSES.PENDING_PORT_ENTRY, name: '港口进场', icon: 'Location' },
  { status: BOOKING_STATUSES.PENDING_LOADING, name: '装船', icon: 'Ship' },
  { status: BOOKING_STATUSES.PENDING_BILL_RELEASE, name: '提单放单', icon: 'Ticket' },
  { status: BOOKING_STATUSES.COMPLETED, name: '完成', icon: 'CircleCheck' },
]

export const PORT_ENTRY_ACTIONS = [
  { value: 'PASS', label: '通过', type: 'success' },
  { value: 'REJECT', label: '驳回', type: 'danger' },
  { value: 'SUPPLEMENT', label: '补充资料', type: 'warning' },
  { value: 'REASSIGN', label: '转派', type: 'info' },
]

export const EXCEPTION_TYPES = {
  LOCATION_DRIFT: '定位漂移',
  ROUTE_DEVIATION: '路线偏离',
  DRIVER_REJECT: '司机拒接',
  ARRIVAL_UNCONFIRMED: '到达未确认',
  MAP_CALLBACK_DELAY: '地图回调延迟',
  OTHER: '其他异常',
}

export const EXCEPTION_STATUSES = {
  PENDING: '待处理',
  HANDLING: '处理中',
  RESOLVED: '已解决',
}

export const BOL_STATUSES = {
  DRAFT: '草稿',
  ISSUED: '已签发',
  RELEASED: '已放单',
  TELEX_RELEASED: '电放',
}
