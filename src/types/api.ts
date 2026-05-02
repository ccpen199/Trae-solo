export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    realName: string;
    phone?: string;
    email?: string;
    role: string;
    organizationId: string;
  };
}

export interface UserProfile {
  id: string;
  username: string;
  realName: string;
  phone?: string;
  email?: string;
  role: string;
  organizationId: string;
  organizationName?: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
}

export enum ScheduleStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  LEAVE_EARLY = 'LEAVE_EARLY',
  LEAVE = 'LEAVE',
  MAKEUP = 'MAKEUP',
}

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Schedule {
  id: string;
  organizationId: string;
  courseId: string;
  teacherId: string;
  classroomId?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  maxStudents: number;
  status: ScheduleStatus;
  notes?: string;
  createdBy?: string;
  course?: Course;
  teacher?: User;
  classroom?: Classroom;
  attendances?: Attendance[];
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  organizationId: string;
  scheduleId: string;
  studentId: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
  isMakeup: boolean;
  makeupId?: string;
  consumption?: Consumption;
  student?: User;
  schedule?: Schedule;
  createdAt: string;
  updatedAt: string;
}

export interface Consumption {
  id: string;
  organizationId: string;
  enrollmentId: string;
  attendanceId: string;
  hoursConsumed: number;
  pricePerHour: number;
  totalAmount: number;
  consumedAt: string;
  notes?: string;
  enrollment?: Enrollment;
  attendance?: Attendance;
  createdAt: string;
}

export interface Enrollment {
  id: string;
  organizationId: string;
  studentId: string;
  courseId: string;
  coursePackageId?: string;
  totalHours: number;
  remainingHours: number;
  usedHours: number;
  startDate: string;
  endDate: string;
  status: EnrollmentStatus;
  notes?: string;
  student?: User;
  course?: Course;
  coursePackage?: CoursePackage;
  payments?: Payment[];
  consumptions?: Consumption[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  organizationId: string;
  enrollmentId: string;
  amount: number;
  paidAmount: number;
  discount?: number;
  paymentMethod?: string;
  transactionId?: string;
  status: string;
  paidAt?: string;
  notes?: string;
  enrollment?: Enrollment;
  createdAt: string;
}

export interface Course {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  defaultPrice: number;
  defaultDuration: number;
  isActive: boolean;
  defaultTeacherId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CoursePackage {
  id: string;
  organizationId: string;
  name: string;
  totalHours: number;
  price: number;
  validMonths: number;
  courseId: string;
  isActive: boolean;
  course?: Course;
  createdAt: string;
  updatedAt: string;
}

export interface Classroom {
  id: string;
  organizationId: string;
  name: string;
  capacity: number;
  equipment?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  organizationId: string;
  username: string;
  realName: string;
  phone?: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum NotificationType {
  SCHEDULE_REMINDER = 'SCHEDULE_REMINDER',
  ATTENDANCE_NOTICE = 'ATTENDANCE_NOTICE',
  LESSON_CONSUMPTION = 'LESSON_CONSUMPTION',
  RENEWAL_REMINDER = 'RENEWAL_REMINDER',
  LEAVE_APPROVAL = 'LEAVE_APPROVAL',
  LEAVE_RESULT = 'LEAVE_RESULT',
  MAKEUP_NOTICE = 'MAKEUP_NOTICE',
  SYSTEM_NOTICE = 'SYSTEM_NOTICE',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  READ = 'READ',
}

export interface Notification {
  id: string;
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  status: NotificationStatus;
  readAt?: string;
  sentAt?: string;
  metadata?: Record<string, unknown>;
  user?: User;
  createdAt: string;
}

export interface ConflictInfo {
  type: 'TEACHER' | 'CLASSROOM' | 'STUDENT';
  entityId: string;
  entityName: string;
  conflictEntityId: string;
  conflictEntityName: string;
  timeRange: {
    date: string;
    start: string;
    end: string;
  };
}

export interface ConflictDetectionResult {
  hasConflict: boolean;
  conflicts: ConflictInfo[];
}

export interface SuggestedSlot {
  date: string;
  startTime: string;
  endTime: string;
  score: number;
}

export interface DashboardData {
  todaySchedules: number;
  todayAttendances: number;
  todayConsumptions: number;
  todayRevenue: number;
  monthlyRevenue: number;
  activeEnrollments: number;
  renewalNeeded: number;
  activeTeachers: number;
  activeCourses: number;
}

export interface ConsumptionSummary {
  totalConsumptions: number;
  totalHours: number;
  totalAmount: number;
  byCourse: Array<{
    courseId: string;
    courseName: string;
    count: number;
    hours: number;
    amount: number;
  }>;
  byTeacher: Array<{
    teacherId: string;
    teacherName: string;
    count: number;
    hours: number;
    amount: number;
  }>;
}

export interface AttendanceStatistics {
  total: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  leaveEarly: number;
  makeup: number;
  attendanceRate: number;
}

export interface RevenueStatistics {
  totalPayments: number;
  totalAmount: number;
  totalDiscount: number;
  byCourse: Array<{
    courseId: string;
    courseName: string;
    count: number;
    amount: number;
  }>;
}

export interface ClassOccupancyItem {
  scheduleId: string;
  courseName: string;
  teacherName: string;
  date: string;
  startTime: string;
  endTime: string;
  maxStudents: number;
  actualStudents: number;
  occupancyRate: number;
}

export interface ClassOccupancyStatistics {
  summary: {
    totalClasses: number;
    averageOccupancy: number;
  };
  details: ClassOccupancyItem[];
}

export interface RenewalCheckResult {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentPhone?: string;
  courseId: string;
  courseName: string;
  packageName?: string;
  totalHours: number;
  usedHours: number;
  remainingHours: number;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  reason: 'hours' | 'expiry' | 'both';
}

export interface RenewalAnalysis {
  totalAtRisk: number;
  byReason: {
    hours: number;
    expiry: number;
    both: number;
  };
  students: RenewalCheckResult[];
}
