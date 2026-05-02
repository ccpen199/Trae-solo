export const UserRole = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  UNKNOWN: 'UNKNOWN',
} as const;

export const CourseType = {
  ONE_ON_ONE: 'ONE_ON_ONE',
  SMALL_GROUP: 'SMALL_GROUP',
  LARGE_CLASS: 'LARGE_CLASS',
} as const;

export const ScheduleStatus = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const;

export const AttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  LEAVE_EARLY: 'LEAVE_EARLY',
  LEAVE: 'LEAVE',
  MAKEUP: 'MAKEUP',
} as const;

export const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
} as const;

export const LeaveStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

export const MakeupStatus = {
  PENDING: 'PENDING',
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const NotificationType = {
  SCHEDULE_REMINDER: 'SCHEDULE_REMINDER',
  ATTENDANCE_NOTICE: 'ATTENDANCE_NOTICE',
  LESSON_CONSUMPTION: 'LESSON_CONSUMPTION',
  RENEWAL_REMINDER: 'RENEWAL_REMINDER',
  LEAVE_APPROVAL: 'LEAVE_APPROVAL',
  LEAVE_RESULT: 'LEAVE_RESULT',
  MAKEUP_NOTICE: 'MAKEUP_NOTICE',
  SYSTEM_NOTICE: 'SYSTEM_NOTICE',
} as const;

export const NotificationStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
  READ: 'READ',
} as const;

export const EnrollmentStatus = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
