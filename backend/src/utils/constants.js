const BOOKING_STATUSES = {
  PENDING_BOOKING: 'pending_booking',
  PENDING_CONTAINER: 'pending_container',
  PENDING_PORT_ENTRY: 'pending_port_entry',
  PENDING_LOADING: 'pending_loading',
  PENDING_BILL_RELEASE: 'pending_bill_release',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
};

const STATUS_LABELS = {
  [BOOKING_STATUSES.PENDING_BOOKING]: '待询价订舱',
  [BOOKING_STATUSES.PENDING_CONTAINER]: '待箱号分配',
  [BOOKING_STATUSES.PENDING_PORT_ENTRY]: '待港口进场',
  [BOOKING_STATUSES.PENDING_LOADING]: '待装船',
  [BOOKING_STATUSES.PENDING_BILL_RELEASE]: '待提单放单',
  [BOOKING_STATUSES.COMPLETED]: '已完成',
  [BOOKING_STATUSES.CANCELLED]: '已撤销',
  [BOOKING_STATUSES.REJECTED]: '已驳回',
};

const ROLES = {
  CONSIGNOR: 'consignor',
  FORWARDER: 'forwarder',
  SHIPPING_COMPANY: 'shipping_company',
  PORT: 'port',
  CUSTOMS_BROKER: 'customs_broker',
};

const ROLE_LABELS = {
  [ROLES.CONSIGNOR]: '货主',
  [ROLES.FORWARDER]: '货代',
  [ROLES.SHIPPING_COMPANY]: '船公司',
  [ROLES.PORT]: '港口',
  [ROLES.CUSTOMS_BROKER]: '报关行',
};

const MESSAGE_TYPES = {
  NEW_BOOKING: 'new_booking',
  CONTAINER_ASSIGNED: 'container_assigned',
  PORT_ENTRY_APPROVED: 'port_entry_approved',
  PORT_ENTRY_REJECTED: 'port_entry_rejected',
  LOADING_COMPLETED: 'loading_completed',
  BILL_RELEASED: 'bill_released',
  EXCEPTION: 'exception',
  REJECTION: 'rejection',
  OVERDUE: 'overdue',
};

const AUDIT_ACTIONS = {
  CREATE_BOOKING: 'create_booking',
  UPDATE_BOOKING: 'update_booking',
  ASSIGN_CONTAINER: 'assign_container',
  APPROVE_PORT_ENTRY: 'approve_port_entry',
  REJECT_PORT_ENTRY: 'reject_port_entry',
  COMPLETE_LOADING: 'complete_loading',
  RELEASE_BILL: 'release_bill',
  CANCEL_BOOKING: 'cancel_booking',
  LOCK_BILL: 'lock_bill',
  UNLOCK_BILL: 'unlock_bill',
};

const EXCEPTION_TYPES = {
  POSITION_DRIFT: 'position_drift',
  ROUTE_DEVIATION: 'route_deviation',
  DRIVER_REFUSE: 'driver_refuse',
  ARRIVAL_UNCONFIRMED: 'arrival_unconfirmed',
  MAP_CALLBACK_DELAY: 'map_callback_delay',
  CONTAINER_CHECK_FAILED: 'container_check_failed',
  FEE_DISPUTE: 'fee_dispute',
};

const CONTAINER_TYPES = [
  '20GP', '40GP', '40HQ', '20RF', '40RF', '20OT', '40OT', '20FR', '40FR', '20TK', '40TK'
];

const STATUS_TRANSITIONS = {
  [BOOKING_STATUSES.PENDING_BOOKING]: {
    allowedActions: ['submit_booking', 'cancel'],
    allowedRoles: [ROLES.CONSIGNOR, ROLES.FORWARDER],
    nextStatus: BOOKING_STATUSES.PENDING_CONTAINER,
    responsibleRole: ROLES.SHIPPING_COMPANY,
  },
  [BOOKING_STATUSES.PENDING_CONTAINER]: {
    allowedActions: ['assign_container', 'reject', 'cancel'],
    allowedRoles: [ROLES.SHIPPING_COMPANY, ROLES.FORWARDER],
    nextStatus: BOOKING_STATUSES.PENDING_PORT_ENTRY,
    responsibleRole: ROLES.PORT,
  },
  [BOOKING_STATUSES.PENDING_PORT_ENTRY]: {
    allowedActions: ['approve_port_entry', 'reject', 'request_additional_info', 'reassign'],
    allowedRoles: [ROLES.PORT, ROLES.CUSTOMS_BROKER],
    nextStatus: BOOKING_STATUSES.PENDING_LOADING,
    responsibleRole: ROLES.SHIPPING_COMPANY,
  },
  [BOOKING_STATUSES.PENDING_LOADING]: {
    allowedActions: ['complete_loading', 'reject', 'cancel'],
    allowedRoles: [ROLES.SHIPPING_COMPANY, ROLES.PORT],
    nextStatus: BOOKING_STATUSES.PENDING_BILL_RELEASE,
    responsibleRole: ROLES.SHIPPING_COMPANY,
  },
  [BOOKING_STATUSES.PENDING_BILL_RELEASE]: {
    allowedActions: ['release_bill', 'reject', 'cancel'],
    allowedRoles: [ROLES.SHIPPING_COMPANY, ROLES.FORWARDER],
    nextStatus: BOOKING_STATUSES.COMPLETED,
    responsibleRole: ROLES.CONSIGNOR,
  },
  [BOOKING_STATUSES.COMPLETED]: {
    allowedActions: ['view'],
    allowedRoles: [ROLES.CONSIGNOR, ROLES.FORWARDER, ROLES.SHIPPING_COMPANY],
    nextStatus: null,
    responsibleRole: null,
  },
};

module.exports = {
  BOOKING_STATUSES,
  STATUS_LABELS,
  ROLES,
  ROLE_LABELS,
  MESSAGE_TYPES,
  AUDIT_ACTIONS,
  EXCEPTION_TYPES,
  CONTAINER_TYPES,
  STATUS_TRANSITIONS,
};
