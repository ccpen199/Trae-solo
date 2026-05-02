export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  IN_CONSULTATION = 'IN_CONSULTATION',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export const AppointmentStatusDisplayNames: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: '待支付',
  [AppointmentStatus.CONFIRMED]: '已预约',
  [AppointmentStatus.CHECKED_IN]: '已签到',
  [AppointmentStatus.IN_CONSULTATION]: '就诊中',
  [AppointmentStatus.COMPLETED]: '已完成',
  [AppointmentStatus.CANCELLED]: '已取消',
  [AppointmentStatus.NO_SHOW]: '未到诊',
};

export enum RegistrationStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CHECKED_IN = 'CHECKED_IN',
  IN_CONSULTATION = 'IN_CONSULTATION',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export const RegistrationStatusDisplayNames: Record<RegistrationStatus, string> = {
  [RegistrationStatus.PENDING]: '待支付',
  [RegistrationStatus.PAID]: '已挂号',
  [RegistrationStatus.CHECKED_IN]: '已签到',
  [RegistrationStatus.IN_CONSULTATION]: '就诊中',
  [RegistrationStatus.COMPLETED]: '已完成',
  [RegistrationStatus.CANCELLED]: '已取消',
  [RegistrationStatus.REFUNDED]: '已退费',
};

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIAL_REFUNDED = 'PARTIAL_REFUNDED',
}

export const PaymentStatusDisplayNames: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: '待支付',
  [PaymentStatus.PROCESSING]: '处理中',
  [PaymentStatus.PAID]: '已支付',
  [PaymentStatus.FAILED]: '支付失败',
  [PaymentStatus.REFUNDED]: '已退款',
  [PaymentStatus.PARTIAL_REFUNDED]: '部分退款',
};

export enum PaymentMethod {
  WECHAT = 'WECHAT',
  ALIPAY = 'ALIPAY',
  CASH = 'CASH',
  CARD = 'CARD',
  INSURANCE = 'INSURANCE',
}

export const PaymentMethodDisplayNames: Record<PaymentMethod, string> = {
  [PaymentMethod.WECHAT]: '微信支付',
  [PaymentMethod.ALIPAY]: '支付宝',
  [PaymentMethod.CASH]: '现金',
  [PaymentMethod.CARD]: '银行卡',
  [PaymentMethod.INSURANCE]: '医保',
};

export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  LOCKED = 'LOCKED',
  BOOKED = 'BOOKED',
  CANCELLED = 'CANCELLED',
}

export const SlotStatusDisplayNames: Record<SlotStatus, string> = {
  [SlotStatus.AVAILABLE]: '可预约',
  [SlotStatus.LOCKED]: '已锁定',
  [SlotStatus.BOOKED]: '已预约',
  [SlotStatus.CANCELLED]: '已取消',
};

export enum ScheduleType {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
  FULL_DAY = 'FULL_DAY',
}

export const ScheduleTypeDisplayNames: Record<ScheduleType, string> = {
  [ScheduleType.MORNING]: '上午',
  [ScheduleType.AFTERNOON]: '下午',
  [ScheduleType.EVENING]: '晚上',
  [ScheduleType.FULL_DAY]: '全天',
};

export enum DoctorTitle {
  INTERN = 'INTERN',
  RESIDENT = 'RESIDENT',
  ATTENDING = 'ATTENDING',
  ASSOCIATE = 'ASSOCIATE',
  CHIEF = 'CHIEF',
}

export const DoctorTitleDisplayNames: Record<DoctorTitle, string> = {
  [DoctorTitle.INTERN]: '实习医师',
  [DoctorTitle.RESIDENT]: '住院医师',
  [DoctorTitle.ATTENDING]: '主治医师',
  [DoctorTitle.ASSOCIATE]: '副主任医师',
  [DoctorTitle.CHIEF]: '主任医师',
};

export enum QueueStatus {
  WAITING = 'WAITING',
  CALLED = 'CALLED',
  IN_CONSULTATION = 'IN_CONSULTATION',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

export const QueueStatusDisplayNames: Record<QueueStatus, string> = {
  [QueueStatus.WAITING]: '等待中',
  [QueueStatus.CALLED]: '已叫号',
  [QueueStatus.IN_CONSULTATION]: '就诊中',
  [QueueStatus.COMPLETED]: '已完成',
  [QueueStatus.SKIPPED]: '已跳过',
};

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  CANCEL = 'CANCEL',
  CONFIRM = 'CONFIRM',
  CHECKIN = 'CHECKIN',
  CALL = 'CALL',
  COMPLETE = 'COMPLETE',
  REFUND = 'REFUND',
  LOCK = 'LOCK',
  RELEASE = 'RELEASE',
  PRINT = 'PRINT',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
}

export const AuditActionDisplayNames: Record<AuditAction, string> = {
  [AuditAction.CREATE]: '创建',
  [AuditAction.UPDATE]: '更新',
  [AuditAction.DELETE]: '删除',
  [AuditAction.CANCEL]: '取消',
  [AuditAction.CONFIRM]: '确认',
  [AuditAction.CHECKIN]: '签到',
  [AuditAction.CALL]: '叫号',
  [AuditAction.COMPLETE]: '完成',
  [AuditAction.REFUND]: '退款',
  [AuditAction.LOCK]: '锁定',
  [AuditAction.RELEASE]: '释放',
  [AuditAction.PRINT]: '打印',
  [AuditAction.LOGIN]: '登录',
  [AuditAction.LOGOUT]: '登出',
};

export enum AuditModule {
  DEPARTMENT = 'DEPARTMENT',
  DOCTOR = 'DOCTOR',
  SCHEDULE = 'SCHEDULE',
  SLOT = 'SLOT',
  APPOINTMENT = 'APPOINTMENT',
  REGISTRATION = 'REGISTRATION',
  PAYMENT = 'PAYMENT',
  QUEUE = 'QUEUE',
  CHECKIN = 'CHECKIN',
  CONSULTATION = 'CONSULTATION',
  REFUND = 'REFUND',
  USER = 'USER',
  ROLE = 'ROLE',
  SYSTEM = 'SYSTEM',
}

export const AuditModuleDisplayNames: Record<AuditModule, string> = {
  [AuditModule.DEPARTMENT]: '科室管理',
  [AuditModule.DOCTOR]: '医生管理',
  [AuditModule.SCHEDULE]: '排班管理',
  [AuditModule.SLOT]: '号源管理',
  [AuditModule.APPOINTMENT]: '预约管理',
  [AuditModule.REGISTRATION]: '挂号管理',
  [AuditModule.PAYMENT]: '支付管理',
  [AuditModule.QUEUE]: '队列管理',
  [AuditModule.CHECKIN]: '签到管理',
  [AuditModule.CONSULTATION]: '就诊管理',
  [AuditModule.REFUND]: '退费管理',
  [AuditModule.USER]: '用户管理',
  [AuditModule.ROLE]: '角色管理',
  [AuditModule.SYSTEM]: '系统管理',
};

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  UNKNOWN = 'UNKNOWN',
}

export const GenderDisplayNames: Record<Gender, string> = {
  [Gender.MALE]: '男',
  [Gender.FEMALE]: '女',
  [Gender.UNKNOWN]: '未知',
};

export enum RefundStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED',
}

export const RefundStatusDisplayNames: Record<RefundStatus, string> = {
  [RefundStatus.PENDING]: '待处理',
  [RefundStatus.PROCESSING]: '处理中',
  [RefundStatus.COMPLETED]: '已完成',
  [RefundStatus.FAILED]: '失败',
  [RefundStatus.REJECTED]: '已拒绝',
};

export enum RefundReason {
  PATIENT_REQUEST = 'PATIENT_REQUEST',
  DOCTOR_ABSENT = 'DOCTOR_ABSENT',
  SCHEDULE_CHANGE = 'SCHEDULE_CHANGE',
  DOUBLE_BOOKING = 'DOUBLE_BOOKING',
  OTHER = 'OTHER',
}

export const RefundReasonDisplayNames: Record<RefundReason, string> = {
  [RefundReason.PATIENT_REQUEST]: '患者申请',
  [RefundReason.DOCTOR_ABSENT]: '医生停诊',
  [RefundReason.SCHEDULE_CHANGE]: '排班变更',
  [RefundReason.DOUBLE_BOOKING]: '重复预约',
  [RefundReason.OTHER]: '其他',
};

export enum NotificationType {
  APPOINTMENT_CONFIRMED = 'APPOINTMENT_CONFIRMED',
  REGISTRATION_SUCCESS = 'REGISTRATION_SUCCESS',
  CHECK_IN_SUCCESS = 'CHECK_IN_SUCCESS',
  QUEUE_CALLED = 'QUEUE_CALLED',
  REFUND_COMPLETED = 'REFUND_COMPLETED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  SYSTEM = 'SYSTEM',
  INFO = 'INFO',
}

export const NotificationTypeDisplayNames: Record<NotificationType, string> = {
  [NotificationType.APPOINTMENT_CONFIRMED]: '预约确认',
  [NotificationType.REGISTRATION_SUCCESS]: '挂号成功',
  [NotificationType.CHECK_IN_SUCCESS]: '签到成功',
  [NotificationType.QUEUE_CALLED]: '叫号通知',
  [NotificationType.REFUND_COMPLETED]: '退款完成',
  [NotificationType.APPOINTMENT_CANCELLED]: '预约取消',
  [NotificationType.SYSTEM]: '系统通知',
  [NotificationType.INFO]: '信息通知',
};
