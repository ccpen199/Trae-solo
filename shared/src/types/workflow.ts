export interface WorkflowNode {
  id: string;
  name: string;
  displayName: string;
  description: string;
  order: number;
  required: boolean;
  allowedRoles: string[];
  requiredPermissions: string[];
  nextNodes: string[];
  previousNodes: string[];
  fields: WorkflowField[];
  actions: WorkflowAction[];
  triggers: WorkflowTrigger[];
}

export interface WorkflowField {
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'enum' | 'reference';
  required: boolean;
  editable: boolean;
  visible: boolean;
  defaultValue?: any;
  enumValues?: string[];
  referenceType?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: string;
  };
}

export interface WorkflowAction {
  name: string;
  displayName: string;
  description: string;
  type: 'TRANSITION' | 'NOTIFICATION' | 'AUDIT' | 'CUSTOM';
  targetNode?: string;
  allowedRoles: string[];
  requiredPermissions: string[];
  conditions?: WorkflowCondition[];
  sideEffects?: WorkflowSideEffect[];
}

export interface WorkflowTrigger {
  event: string;
  type: 'AUTOMATIC' | 'MANUAL' | 'TIMER' | 'WEBHOOK';
  conditions?: WorkflowCondition[];
  actions: string[];
}

export interface WorkflowCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains' | 'empty' | 'notEmpty';
  value: any;
}

export interface WorkflowSideEffect {
  type: 'UPDATE_STATUS' | 'SEND_NOTIFICATION' | 'CREATE_AUDIT' | 'UPDATE_RESOURCE' | 'CUSTOM';
  resourceType?: string;
  resourceId?: string;
  field?: string;
  value?: any;
  notificationType?: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  notificationTemplate?: string;
  auditModule?: string;
  auditAction?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  startNode: string;
  endNodes: string[];
  nodes: WorkflowNode[];
  globalFields: WorkflowField[];
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export const APPOINTMENT_WORKFLOW: WorkflowDefinition = {
  id: 'appointment',
  name: '预约挂号流程',
  displayName: '预约挂号流程',
  description: '从号源选择到就诊完成的完整预约挂号业务流程',
  version: '1.0.0',
  status: 'ACTIVE',
  startNode: 'slot_selection',
  endNodes: ['completed', 'cancelled', 'no_show'],
  nodes: [
    {
      id: 'slot_selection',
      name: '号源选择',
      displayName: '号源选择',
      description: '患者选择科室、医生和时段',
      order: 1,
      required: true,
      allowedRoles: ['PATIENT', 'REGISTRAR'],
      requiredPermissions: ['APPOINTMENT_CREATE', 'SLOT_VIEW'],
      nextNodes: ['appointment_created'],
      previousNodes: [],
      fields: [
        { name: 'departmentId', displayName: '科室', type: 'reference', referenceType: 'Department', required: true, editable: true, visible: true },
        { name: 'doctorId', displayName: '医生', type: 'reference', referenceType: 'Doctor', required: true, editable: true, visible: true },
        { name: 'scheduleId', displayName: '排班', type: 'reference', referenceType: 'Schedule', required: true, editable: true, visible: true },
        { name: 'slotId', displayName: '号源时段', type: 'reference', referenceType: 'TimeSlot', required: true, editable: true, visible: true },
        { name: 'appointmentDate', displayName: '预约日期', type: 'date', required: true, editable: true, visible: true },
        { name: 'notes', displayName: '备注', type: 'string', required: false, editable: true, visible: true },
      ],
      actions: [
        {
          name: 'lock_slot',
          displayName: '锁定号源',
          description: '锁定选中的号源防止重复预约',
          type: 'CUSTOM',
          allowedRoles: ['PATIENT', 'REGISTRAR'],
          requiredPermissions: ['SLOT_LOCK'],
          sideEffects: [
            { type: 'UPDATE_STATUS', resourceType: 'TimeSlot', field: 'status', value: 'LOCKED' },
            { type: 'CREATE_AUDIT', auditModule: 'SLOT', auditAction: 'LOCK' },
          ],
        },
        {
          name: 'create_appointment',
          displayName: '创建预约',
          description: '创建预约记录并进入待支付状态',
          type: 'TRANSITION',
          targetNode: 'appointment_created',
          allowedRoles: ['PATIENT', 'REGISTRAR'],
          requiredPermissions: ['APPOINTMENT_CREATE'],
          sideEffects: [
            { type: 'CREATE_AUDIT', auditModule: 'APPOINTMENT', auditAction: 'CREATE' },
          ],
        },
      ],
      triggers: [
        { event: 'slot_selected', type: 'MANUAL', actions: ['lock_slot', 'create_appointment'] },
      ],
    },
    {
      id: 'appointment_created',
      name: '预约创建',
      displayName: '预约创建',
      description: '预约已创建，等待支付',
      order: 2,
      required: true,
      allowedRoles: ['PATIENT', 'REGISTRAR'],
      requiredPermissions: ['APPOINTMENT_VIEW', 'PAYMENT_PROCESS'],
      nextNodes: ['payment_pending', 'cancelled'],
      previousNodes: ['slot_selection'],
      fields: [
        { name: 'appointmentId', displayName: '预约单号', type: 'string', required: true, editable: false, visible: true },
        { name: 'status', displayName: '状态', type: 'enum', enumValues: ['PENDING', 'CONFIRMED'], required: true, editable: false, visible: true },
        { name: 'amount', displayName: '金额', type: 'number', required: true, editable: false, visible: true },
        { name: 'expiresAt', displayName: '支付截止时间', type: 'datetime', required: true, editable: false, visible: true },
      ],
      actions: [
        {
          name: 'process_payment',
          displayName: '完成支付',
          description: '完成支付确认预约',
          type: 'TRANSITION',
          targetNode: 'payment_pending',
          allowedRoles: ['PATIENT', 'REGISTRAR'],
          requiredPermissions: ['PAYMENT_PROCESS'],
          sideEffects: [
            { type: 'CREATE_AUDIT', auditModule: 'PAYMENT', auditAction: 'CONFIRM' },
          ],
        },
        {
          name: 'cancel_appointment',
          displayName: '取消预约',
          description: '取消预约并释放号源',
          type: 'TRANSITION',
          targetNode: 'cancelled',
          allowedRoles: ['PATIENT', 'REGISTRAR'],
          requiredPermissions: ['APPOINTMENT_CANCEL'],
          sideEffects: [
            { type: 'UPDATE_STATUS', resourceType: 'TimeSlot', field: 'status', value: 'AVAILABLE' },
            { type: 'CREATE_AUDIT', auditModule: 'APPOINTMENT', auditAction: 'CANCEL' },
          ],
        },
      ],
      triggers: [
        { event: 'payment_timeout', type: 'TIMER', conditions: [{ field: 'status', operator: 'eq', value: 'PENDING' }], actions: ['cancel_appointment'] },
      ],
    },
    {
      id: 'payment_pending',
      name: '支付确认',
      displayName: '支付确认',
      description: '支付确认中，生成挂号单',
      order: 3,
      required: true,
      allowedRoles: ['PATIENT', 'REGISTRAR'],
      requiredPermissions: ['PAYMENT_PROCESS', 'REGISTRATION_CREATE'],
      nextNodes: ['registration_created', 'payment_failed'],
      previousNodes: ['appointment_created'],
      fields: [
        { name: 'paymentId', displayName: '支付单号', type: 'string', required: true, editable: false, visible: true },
        { name: 'paymentMethod', displayName: '支付方式', type: 'enum', enumValues: ['WECHAT', 'ALIPAY', 'CASH', 'CARD', 'INSURANCE'], required: true, editable: true, visible: true },
        { name: 'transactionId', displayName: '交易流水号', type: 'string', required: false, editable: false, visible: true },
      ],
      actions: [
        {
          name: 'confirm_payment',
          displayName: '确认支付',
          description: '支付成功，创建挂号单',
          type: 'TRANSITION',
          targetNode: 'registration_created',
          allowedRoles: ['PATIENT', 'REGISTRAR'],
          requiredPermissions: ['PAYMENT_PROCESS'],
          sideEffects: [
            { type: 'UPDATE_STATUS', resourceType: 'Payment', field: 'status', value: 'PAID' },
            { type: 'UPDATE_STATUS', resourceType: 'TimeSlot', field: 'status', value: 'BOOKED' },
            { type: 'CREATE_AUDIT', auditModule: 'PAYMENT', auditAction: 'CONFIRM' },
          ],
        },
        {
          name: 'payment_failed',
          displayName: '支付失败',
          description: '支付失败，释放号源',
          type: 'TRANSITION',
          targetNode: 'cancelled',
          allowedRoles: ['PATIENT', 'REGISTRAR'],
          requiredPermissions: ['PAYMENT_PROCESS'],
          sideEffects: [
            { type: 'UPDATE_STATUS', resourceType: 'TimeSlot', field: 'status', value: 'AVAILABLE' },
            { type: 'CREATE_AUDIT', auditModule: 'PAYMENT', auditAction: 'UPDATE' },
          ],
        },
      ],
      triggers: [
        { event: 'payment_success', type: 'WEBHOOK', actions: ['confirm_payment'] },
        { event: 'payment_failed', type: 'WEBHOOK', actions: ['payment_failed'] },
      ],
    },
    {
      id: 'registration_created',
      name: '挂号完成',
      displayName: '挂号完成',
      description: '挂号单已生成，等待签到',
      order: 4,
      required: true,
      allowedRoles: ['PATIENT', 'NURSE', 'REGISTRAR'],
      requiredPermissions: ['REGISTRATION_VIEW', 'CHECKIN_PROCESS'],
      nextNodes: ['checked_in', 'cancelled'],
      previousNodes: ['payment_pending'],
      fields: [
        { name: 'registrationId', displayName: '挂号单号', type: 'string', required: true, editable: false, visible: true },
        { name: 'queueNumber', displayName: '候诊序号', type: 'number', required: true, editable: false, visible: true },
        { name: 'displayNumber', displayName: '叫号显示号', type: 'string', required: true, editable: false, visible: true },
        { name: 'estimatedTime', displayName: '预计就诊时间', type: 'string', required: false, editable: false, visible: true },
        { name: 'roomNumber', displayName: '诊室', type: 'string', required: false, editable: false, visible: true },
      ],
      actions: [
        {
          name: 'check_in',
          displayName: '到院签到',
          description: '患者到院签到，进入候诊队列',
          type: 'TRANSITION',
          targetNode: 'checked_in',
          allowedRoles: ['PATIENT', 'NURSE', 'REGISTRAR'],
          requiredPermissions: ['CHECKIN_PROCESS'],
          sideEffects: [
            { type: 'UPDATE_STATUS', resourceType: 'Registration', field: 'status', value: 'CHECKED_IN' },
            { type: 'UPDATE_STATUS', resourceType: 'QueueItem', field: 'status', value: 'WAITING' },
            { type: 'CREATE_AUDIT', auditModule: 'CHECKIN', auditAction: 'CHECKIN' },
          ],
        },
        {
          name: 'cancel_registration',
          displayName: '取消挂号',
          description: '取消挂号并申请退费',
          type: 'TRANSITION',
          targetNode: 'cancelled',
          allowedRoles: ['PATIENT', 'REGISTRAR'],
          requiredPermissions: ['REGISTRATION_CANCEL'],
          sideEffects: [
            { type: 'UPDATE_STATUS', resourceType: 'TimeSlot', field: 'status', value: 'AVAILABLE' },
            { type: 'CREATE_AUDIT', auditModule: 'REGISTRATION', auditAction: 'CANCEL' },
          ],
        },
      ],
      triggers: [
        { event: 'scan_qr_code', type: 'MANUAL', actions: ['check_in'] },
        { event: 'appointment_time', type: 'TIMER', actions: [] },
      ],
    },
    {
      id: 'checked_in',
      name: '已签到',
      displayName: '已签到',
      description: '患者已签到，在候诊队列中等待',
      order: 5,
      required: true,
      allowedRoles: ['PATIENT', 'NURSE', 'DOCTOR'],
      requiredPermissions: ['QUEUE_VIEW', 'QUEUE_CALL'],
      nextNodes: ['in_consultation', 'no_show'],
      previousNodes: ['registration_created'],
      fields: [
        { name: 'queuePosition', displayName: '当前排队位置', type: 'number', required: true, editable: false, visible: true },
        { name: 'aheadCount', displayName: '前方等待人数', type: 'number', required: true, editable: false, visible: true },
        { name: 'checkedInAt', displayName: '签到时间', type: 'datetime', required: true, editable: false, visible: true },
      ],
      actions: [
        {
          name: 'call_patient',
          displayName: '叫号',
          description: '呼叫患者进入诊室',
          type: 'TRANSITION',
          targetNode: 'in_consultation',
          allowedRoles: ['NURSE', 'DOCTOR'],
          requiredPermissions: ['QUEUE_CALL'],
          sideEffects: [
            { type: 'UPDATE_STATUS', resourceType: 'QueueItem', field: 'status', value: 'CALLED' },
            { type: 'CREATE_AUDIT', auditModule: 'QUEUE', auditAction: 'CALL' },
          ],
        },
        {
          name: 'mark_no_show',
          displayName: '标记未到诊',
          description: '患者未到诊，标记为未到',
          type: 'TRANSITION',
          targetNode: 'no_show',
          allowedRoles: ['NURSE', 'DOCTOR'],
          requiredPermissions: ['QUEUE_MANAGE'],
          sideEffects: [
            { type: 'UPDATE_STATUS', resourceType: 'Registration', field: 'status', value: 'PAID' },
            { type: 'CREATE_AUDIT', auditModule: 'QUEUE', auditAction: 'UPDATE' },
          ],
        },
      ],
      triggers: [
        { event: 'queue_position_change', type: 'AUTOMATIC', actions: [] },
      ],
    },
    {
      id: 'in_consultation',
      name: '就诊中',
      displayName: '就诊中',
      description: '患者正在就诊',
      order: 6,
      required: true,
      allowedRoles: ['DOCTOR', 'NURSE'],
      requiredPermissions: ['CONSULTATION_PROCESS'],
      nextNodes: ['completed', 'cancelled'],
      previousNodes: ['checked_in'],
      fields: [
        { name: 'consultationStartTime', displayName: '就诊开始时间', type: 'datetime', required: true, editable: false, visible: true },
        { name: 'consultationNotes', displayName: '就诊记录', type: 'string', required: false, editable: true, visible: true },
        { name: 'prescriptions', displayName: '处方', type: 'string', required: false, editable: true, visible: true },
      ],
      actions: [
        {
          name: 'complete_consultation',
          displayName: '完成就诊',
          description: '就诊完成，更新状态',
          type: 'TRANSITION',
          targetNode: 'completed',
          allowedRoles: ['DOCTOR'],
          requiredPermissions: ['CONSULTATION_PROCESS'],
          sideEffects: [
            { type: 'UPDATE_STATUS', resourceType: 'Registration', field: 'status', value: 'COMPLETED' },
            { type: 'UPDATE_STATUS', resourceType: 'QueueItem', field: 'status', value: 'COMPLETED' },
            { type: 'CREATE_AUDIT', auditModule: 'CONSULTATION', auditAction: 'COMPLETE' },
          ],
        },
      ],
      triggers: [],
    },
    {
      id: 'completed',
      name: '已完成',
      displayName: '已完成',
      description: '挂号流程已完成',
      order: 7,
      required: true,
      allowedRoles: ['PATIENT', 'DOCTOR', 'NURSE', 'REGISTRAR'],
      requiredPermissions: ['REGISTRATION_VIEW'],
      nextNodes: [],
      previousNodes: ['in_consultation'],
      fields: [
        { name: 'consultationEndTime', displayName: '就诊结束时间', type: 'datetime', required: true, editable: false, visible: true },
        { name: 'totalTime', displayName: '总耗时', type: 'number', required: true, editable: false, visible: true },
      ],
      actions: [],
      triggers: [],
    },
    {
      id: 'cancelled',
      name: '已取消',
      displayName: '已取消',
      description: '预约/挂号已取消',
      order: 8,
      required: false,
      allowedRoles: ['PATIENT', 'REGISTRAR'],
      requiredPermissions: ['APPOINTMENT_VIEW', 'REGISTRATION_VIEW'],
      nextNodes: [],
      previousNodes: ['appointment_created', 'registration_created'],
      fields: [
        { name: 'cancelReason', displayName: '取消原因', type: 'string', required: true, editable: true, visible: true },
        { name: 'cancelledAt', displayName: '取消时间', type: 'datetime', required: true, editable: false, visible: true },
        { name: 'refundStatus', displayName: '退费状态', type: 'enum', enumValues: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], required: false, editable: false, visible: true },
      ],
      actions: [
        {
          name: 'initiate_refund',
          displayName: '申请退费',
          description: '发起退费申请',
          type: 'CUSTOM',
          allowedRoles: ['PATIENT', 'REGISTRAR'],
          requiredPermissions: ['PAYMENT_REFUND'],
          sideEffects: [
            { type: 'UPDATE_STATUS', resourceType: 'Refund', field: 'status', value: 'PENDING' },
            { type: 'CREATE_AUDIT', auditModule: 'REFUND', auditAction: 'CREATE' },
          ],
        },
      ],
      triggers: [],
    },
    {
      id: 'no_show',
      name: '未到诊',
      displayName: '未到诊',
      description: '患者未按时就诊',
      order: 9,
      required: false,
      allowedRoles: ['NURSE', 'DOCTOR', 'REGISTRAR'],
      requiredPermissions: ['REGISTRATION_VIEW'],
      nextNodes: [],
      previousNodes: ['checked_in'],
      fields: [
        { name: 'markedAt', displayName: '标记时间', type: 'datetime', required: true, editable: false, visible: true },
        { name: 'markedBy', displayName: '标记人', type: 'reference', referenceType: 'User', required: true, editable: false, visible: true },
      ],
      actions: [],
      triggers: [],
    },
  ],
  globalFields: [
    { name: 'patientId', displayName: '患者ID', type: 'reference', referenceType: 'User', required: true, editable: false, visible: true },
    { name: 'patientName', displayName: '患者姓名', type: 'string', required: true, editable: false, visible: true },
    { name: 'createdAt', displayName: '创建时间', type: 'datetime', required: true, editable: false, visible: true },
  ],
  createdBy: 'system',
  createdAt: new Date(),
};

export interface WorkflowTransition {
  from: string;
  to: string;
  allowedRoles: string[];
  description?: string;
}

export const WORKFLOW_TRANSITIONS: Record<'appointment' | 'registration' | 'queue', WorkflowTransition[]> = {
  appointment: [
    { from: 'PENDING', to: 'CONFIRMED', allowedRoles: ['PATIENT', 'REGISTRAR'], description: '预约确认' },
    { from: 'PENDING', to: 'CANCELLED', allowedRoles: ['PATIENT', 'REGISTRAR'], description: '预约取消' },
    { from: 'CONFIRMED', to: 'CANCELLED', allowedRoles: ['PATIENT', 'REGISTRAR'], description: '预约取消' },
  ],
  registration: [
    { from: 'PAID', to: 'CHECKED_IN', allowedRoles: ['PATIENT', 'NURSE', 'REGISTRAR'], description: '签到' },
    { from: 'PAID', to: 'CANCELLED', allowedRoles: ['PATIENT', 'REGISTRAR'], description: '取消挂号' },
    { from: 'CHECKED_IN', to: 'IN_CONSULTATION', allowedRoles: ['DOCTOR', 'NURSE'], description: '开始就诊' },
    { from: 'IN_CONSULTATION', to: 'COMPLETED', allowedRoles: ['DOCTOR'], description: '完成就诊' },
    { from: 'CHECKED_IN', to: 'CANCELLED', allowedRoles: ['REGISTRAR'], description: '取消挂号' },
  ],
  queue: [
    { from: 'WAITING', to: 'CALLED', allowedRoles: ['DOCTOR', 'NURSE'], description: '叫号' },
    { from: 'CALLED', to: 'IN_CONSULTATION', allowedRoles: ['DOCTOR', 'NURSE'], description: '开始就诊' },
    { from: 'WAITING', to: 'SKIPPED', allowedRoles: ['DOCTOR', 'NURSE'], description: '跳过' },
    { from: 'SKIPPED', to: 'CALLED', allowedRoles: ['DOCTOR', 'NURSE'], description: '重新叫号' },
    { from: 'IN_CONSULTATION', to: 'COMPLETED', allowedRoles: ['DOCTOR'], description: '完成就诊' },
    { from: 'WAITING', to: 'CANCELLED', allowedRoles: ['REGISTRAR'], description: '取消' },
  ],
};
