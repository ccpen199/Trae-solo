export enum Permission {
  DEPARTMENT_VIEW = 'DEPARTMENT_VIEW',
  DEPARTMENT_CREATE = 'DEPARTMENT_CREATE',
  DEPARTMENT_UPDATE = 'DEPARTMENT_UPDATE',
  DEPARTMENT_DELETE = 'DEPARTMENT_DELETE',

  DOCTOR_VIEW = 'DOCTOR_VIEW',
  DOCTOR_CREATE = 'DOCTOR_CREATE',
  DOCTOR_UPDATE = 'DOCTOR_UPDATE',
  DOCTOR_DELETE = 'DOCTOR_DELETE',

  SCHEDULE_VIEW = 'SCHEDULE_VIEW',
  SCHEDULE_CREATE = 'SCHEDULE_CREATE',
  SCHEDULE_UPDATE = 'SCHEDULE_UPDATE',
  SCHEDULE_DELETE = 'SCHEDULE_DELETE',

  SLOT_VIEW = 'SLOT_VIEW',
  SLOT_MANAGE = 'SLOT_MANAGE',
  SLOT_LOCK = 'SLOT_LOCK',
  SLOT_RELEASE = 'SLOT_RELEASE',

  APPOINTMENT_VIEW = 'APPOINTMENT_VIEW',
  APPOINTMENT_CREATE = 'APPOINTMENT_CREATE',
  APPOINTMENT_CANCEL = 'APPOINTMENT_CANCEL',
  APPOINTMENT_UPDATE = 'APPOINTMENT_UPDATE',

  REGISTRATION_VIEW = 'REGISTRATION_VIEW',
  REGISTRATION_CREATE = 'REGISTRATION_CREATE',
  REGISTRATION_CANCEL = 'REGISTRATION_CANCEL',
  REGISTRATION_UPDATE = 'REGISTRATION_UPDATE',
  REGISTRATION_PRINT = 'REGISTRATION_PRINT',

  PAYMENT_VIEW = 'PAYMENT_VIEW',
  PAYMENT_PROCESS = 'PAYMENT_PROCESS',
  PAYMENT_REFUND = 'PAYMENT_REFUND',

  QUEUE_VIEW = 'QUEUE_VIEW',
  QUEUE_MANAGE = 'QUEUE_MANAGE',
  QUEUE_CALL = 'QUEUE_CALL',

  CHECKIN_VIEW = 'CHECKIN_VIEW',
  CHECKIN_PROCESS = 'CHECKIN_PROCESS',

  CONSULTATION_VIEW = 'CONSULTATION_VIEW',
  CONSULTATION_PROCESS = 'CONSULTATION_PROCESS',

  AUDIT_VIEW = 'AUDIT_VIEW',
  AUDIT_EXPORT = 'AUDIT_EXPORT',

  STATISTICS_VIEW = 'STATISTICS_VIEW',
  STATISTICS_EXPORT = 'STATISTICS_EXPORT',

  USER_VIEW = 'USER_VIEW',
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',

  ROLE_VIEW = 'ROLE_VIEW',
  ROLE_MANAGE = 'ROLE_MANAGE',
}

export const PermissionDisplayNames: Record<Permission, string> = {
  [Permission.DEPARTMENT_VIEW]: '查看科室',
  [Permission.DEPARTMENT_CREATE]: '创建科室',
  [Permission.DEPARTMENT_UPDATE]: '更新科室',
  [Permission.DEPARTMENT_DELETE]: '删除科室',

  [Permission.DOCTOR_VIEW]: '查看医生',
  [Permission.DOCTOR_CREATE]: '创建医生',
  [Permission.DOCTOR_UPDATE]: '更新医生',
  [Permission.DOCTOR_DELETE]: '删除医生',

  [Permission.SCHEDULE_VIEW]: '查看排班',
  [Permission.SCHEDULE_CREATE]: '创建排班',
  [Permission.SCHEDULE_UPDATE]: '更新排班',
  [Permission.SCHEDULE_DELETE]: '删除排班',

  [Permission.SLOT_VIEW]: '查看号源',
  [Permission.SLOT_MANAGE]: '管理号源',
  [Permission.SLOT_LOCK]: '锁定号源',
  [Permission.SLOT_RELEASE]: '释放号源',

  [Permission.APPOINTMENT_VIEW]: '查看预约',
  [Permission.APPOINTMENT_CREATE]: '创建预约',
  [Permission.APPOINTMENT_CANCEL]: '取消预约',
  [Permission.APPOINTMENT_UPDATE]: '更新预约',

  [Permission.REGISTRATION_VIEW]: '查看挂号',
  [Permission.REGISTRATION_CREATE]: '创建挂号',
  [Permission.REGISTRATION_CANCEL]: '取消挂号',
  [Permission.REGISTRATION_UPDATE]: '更新挂号',
  [Permission.REGISTRATION_PRINT]: '打印挂号单',

  [Permission.PAYMENT_VIEW]: '查看支付',
  [Permission.PAYMENT_PROCESS]: '处理支付',
  [Permission.PAYMENT_REFUND]: '处理退款',

  [Permission.QUEUE_VIEW]: '查看队列',
  [Permission.QUEUE_MANAGE]: '管理队列',
  [Permission.QUEUE_CALL]: '叫号',

  [Permission.CHECKIN_VIEW]: '查看签到',
  [Permission.CHECKIN_PROCESS]: '处理签到',

  [Permission.CONSULTATION_VIEW]: '查看就诊',
  [Permission.CONSULTATION_PROCESS]: '处理就诊',

  [Permission.AUDIT_VIEW]: '查看审计',
  [Permission.AUDIT_EXPORT]: '导出审计',

  [Permission.STATISTICS_VIEW]: '查看统计',
  [Permission.STATISTICS_EXPORT]: '导出统计',

  [Permission.USER_VIEW]: '查看用户',
  [Permission.USER_CREATE]: '创建用户',
  [Permission.USER_UPDATE]: '更新用户',
  [Permission.USER_DELETE]: '删除用户',

  [Permission.ROLE_VIEW]: '查看角色',
  [Permission.ROLE_MANAGE]: '管理角色',
};

export const RolePermissions: Record<string, Permission[]> = {
  PATIENT: [
    Permission.DEPARTMENT_VIEW,
    Permission.DOCTOR_VIEW,
    Permission.SCHEDULE_VIEW,
    Permission.SLOT_VIEW,
    Permission.APPOINTMENT_VIEW,
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_CANCEL,
    Permission.REGISTRATION_VIEW,
    Permission.PAYMENT_VIEW,
    Permission.PAYMENT_PROCESS,
    Permission.QUEUE_VIEW,
    Permission.CHECKIN_VIEW,
    Permission.CONSULTATION_VIEW,
  ],
  DOCTOR: [
    Permission.DEPARTMENT_VIEW,
    Permission.DOCTOR_VIEW,
    Permission.SCHEDULE_VIEW,
    Permission.SLOT_VIEW,
    Permission.APPOINTMENT_VIEW,
    Permission.REGISTRATION_VIEW,
    Permission.QUEUE_VIEW,
    Permission.QUEUE_CALL,
    Permission.CHECKIN_VIEW,
    Permission.CONSULTATION_VIEW,
    Permission.CONSULTATION_PROCESS,
  ],
  NURSE: [
    Permission.DEPARTMENT_VIEW,
    Permission.DOCTOR_VIEW,
    Permission.SCHEDULE_VIEW,
    Permission.SLOT_VIEW,
    Permission.APPOINTMENT_VIEW,
    Permission.REGISTRATION_VIEW,
    Permission.QUEUE_VIEW,
    Permission.QUEUE_MANAGE,
    Permission.QUEUE_CALL,
    Permission.CHECKIN_VIEW,
    Permission.CHECKIN_PROCESS,
    Permission.CONSULTATION_VIEW,
  ],
  REGISTRAR: [
    Permission.DEPARTMENT_VIEW,
    Permission.DOCTOR_VIEW,
    Permission.SCHEDULE_VIEW,
    Permission.SLOT_VIEW,
    Permission.APPOINTMENT_VIEW,
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_CANCEL,
    Permission.APPOINTMENT_UPDATE,
    Permission.REGISTRATION_VIEW,
    Permission.REGISTRATION_CREATE,
    Permission.REGISTRATION_CANCEL,
    Permission.REGISTRATION_UPDATE,
    Permission.REGISTRATION_PRINT,
    Permission.PAYMENT_VIEW,
    Permission.PAYMENT_PROCESS,
    Permission.PAYMENT_REFUND,
    Permission.QUEUE_VIEW,
    Permission.STATISTICS_VIEW,
  ],
  ADMIN: [
    ...Object.values(Permission),
  ],
};
