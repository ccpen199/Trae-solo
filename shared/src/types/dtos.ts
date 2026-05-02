import { Role } from './roles';
import {
  AppointmentStatus,
  RegistrationStatus,
  PaymentStatus,
  PaymentMethod,
  SlotStatus,
  ScheduleType,
  DoctorTitle,
  QueueStatus,
  Gender,
  RefundStatus,
  RefundReason,
  AuditAction,
  AuditModule,
} from './enums';

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  refreshToken: string;
  user: UserDto;
  permissions: string[];
}

export interface UserDto {
  id: string;
  username: string;
  name: string;
  role: Role;
  email?: string;
  phone?: string;
  avatar?: string;
  gender?: Gender;
  birthDate?: Date;
  idNumber?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

export interface CreateUserDto {
  username: string;
  password: string;
  name: string;
  role: Role;
  email?: string;
  phone?: string;
  gender?: Gender;
  birthDate?: Date;
  idNumber?: string;
  address?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  gender?: Gender;
  birthDate?: Date;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  isActive?: boolean;
}

export interface DepartmentDto {
  id: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  floor?: string;
  roomNumber?: string;
  createdAt: Date;
}

export interface CreateDepartmentDto {
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
  floor?: string;
  roomNumber?: string;
}

export interface UpdateDepartmentDto {
  name?: string;
  code?: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
  isActive?: boolean;
  floor?: string;
  roomNumber?: string;
}

export interface DoctorDto {
  id: string;
  userId: string;
  departmentId: string;
  title: DoctorTitle;
  specialties: string[];
  introduction?: string;
  consultationFee: number;
  isActive: boolean;
  createdAt: Date;
  user?: UserDto;
  department?: DepartmentDto;
}

export interface CreateDoctorDto {
  userId: string;
  departmentId: string;
  title: DoctorTitle;
  specialties: string[];
  introduction?: string;
  consultationFee: number;
}

export interface UpdateDoctorDto {
  departmentId?: string;
  title?: DoctorTitle;
  specialties?: string[];
  introduction?: string;
  consultationFee?: number;
  isActive?: boolean;
}

export interface ScheduleDto {
  id: string;
  doctorId: string;
  departmentId: string;
  date: Date;
  type: ScheduleType;
  startTime: string;
  endTime: string;
  totalSlots: number;
  availableSlots: number;
  roomNumber?: string;
  isActive: boolean;
  createdAt: Date;
  doctor?: DoctorDto;
  department?: DepartmentDto;
}

export interface CreateScheduleDto {
  doctorId: string;
  departmentId: string;
  date: Date;
  type: ScheduleType;
  startTime: string;
  endTime: string;
  totalSlots: number;
  roomNumber?: string;
}

export interface UpdateScheduleDto {
  startTime?: string;
  endTime?: string;
  totalSlots?: number;
  roomNumber?: string;
  isActive?: boolean;
}

export interface TimeSlotDto {
  id: string;
  scheduleId: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  appointmentId?: string;
  lockedBy?: string;
  lockedAt?: Date;
  createdAt: Date;
  schedule?: ScheduleDto;
}

export interface AppointmentDto {
  id: string;
  patientId: string;
  doctorId: string;
  departmentId: string;
  scheduleId: string;
  slotId: string;
  appointmentDate: Date;
  status: AppointmentStatus;
  queueNumber?: number;
  estimatedTime?: string;
  notes?: string;
  cancelReason?: string;
  cancelledAt?: Date;
  createdAt: Date;
  patient?: UserDto;
  doctor?: DoctorDto;
  department?: DepartmentDto;
  schedule?: ScheduleDto;
  slot?: TimeSlotDto;
}

export interface CreateAppointmentDto {
  doctorId: string;
  departmentId: string;
  scheduleId: string;
  slotId: string;
  appointmentDate: Date;
  notes?: string;
}

export interface CancelAppointmentDto {
  reason: string;
}

export interface RegistrationDto {
  id: string;
  appointmentId?: string;
  patientId: string;
  doctorId: string;
  departmentId: string;
  scheduleId: string;
  slotId: string;
  registrationDate: Date;
  queueNumber: number;
  status: RegistrationStatus;
  registrationType: 'ONLINE' | 'ON_SITE';
  isInsurance: boolean;
  fee: number;
  checkedInAt?: Date;
  consultationStartTime?: Date;
  consultationEndTime?: Date;
  notes?: string;
  createdAt: Date;
  patient?: UserDto;
  doctor?: DoctorDto;
  department?: DepartmentDto;
  schedule?: ScheduleDto;
  slot?: TimeSlotDto;
}

export interface CreateRegistrationDto {
  patientId: string;
  doctorId: string;
  departmentId: string;
  scheduleId: string;
  slotId: string;
  registrationDate: Date;
  registrationType: 'ONLINE' | 'ON_SITE';
  isInsurance: boolean;
  appointmentId?: string;
  notes?: string;
}

export interface PaymentDto {
  id: string;
  registrationId?: string;
  appointmentId?: string;
  patientId: string;
  amount: number;
  status: PaymentStatus;
  method?: PaymentMethod;
  transactionId?: string;
  paidAt?: Date;
  refundAmount: number;
  refundedAt?: Date;
  notes?: string;
  createdAt: Date;
}

export interface CreatePaymentDto {
  registrationId?: string;
  appointmentId?: string;
  method: PaymentMethod;
  amount: number;
}

export interface ProcessPaymentDto {
  method: PaymentMethod;
  transactionId?: string;
}

export interface RefundDto {
  id: string;
  paymentId: string;
  registrationId?: string;
  appointmentId?: string;
  amount: number;
  status: RefundStatus;
  reason: RefundReason;
  reasonDetail?: string;
  transactionId?: string;
  processedAt?: Date;
  processedBy?: string;
  notes?: string;
  createdAt: Date;
}

export interface CreateRefundDto {
  paymentId: string;
  amount: number;
  reason: RefundReason;
  reasonDetail?: string;
  notes?: string;
}

export interface QueueItemDto {
  id: string;
  registrationId: string;
  doctorId: string;
  departmentId: string;
  queueDate: Date;
  queueNumber: number;
  displayNumber: string;
  status: QueueStatus;
  calledAt?: Date;
  calledBy?: string;
  consultationStartTime?: Date;
  consultationEndTime?: Date;
  sortOrder: number;
  isPriority: boolean;
  priorityReason?: string;
  createdAt: Date;
  registration?: RegistrationDto;
  doctor?: DoctorDto;
  department?: DepartmentDto;
}

export interface CallQueueDto {
  registrationId: string;
}

export interface AuditLogDto {
  id: string;
  module: AuditModule;
  action: AuditAction;
  userId: string;
  userName: string;
  userRole: Role;
  resourceType: string;
  resourceId: string;
  resourceName?: string;
  oldValue?: string;
  newValue?: string;
  changes?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  createdAt: Date;
}

export interface AuditLogQueryParams extends PaginationParams {
  module?: AuditModule;
  action?: AuditAction;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface StatisticsDto {
  totalRegistrations: number;
  completedConsultations: number;
  cancellationRate: number;
  visitRate: number;
  departmentStats: DepartmentStatDto[];
  doctorStats: DoctorStatDto[];
  dailyStats: DailyStatDto[];
}

export interface DepartmentStatDto {
  departmentId: string;
  departmentName: string;
  totalRegistrations: number;
  completedConsultations: number;
  visitRate: number;
  cancellationRate: number;
}

export interface DoctorStatDto {
  doctorId: string;
  doctorName: string;
  departmentId: string;
  departmentName: string;
  totalRegistrations: number;
  completedConsultations: number;
  visitRate: number;
  averageConsultationTime: number;
}

export interface DailyStatDto {
  date: Date;
  totalRegistrations: number;
  completedConsultations: number;
  visitRate: number;
  cancellationRate: number;
}

export interface NotificationDto {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  readAt?: Date;
  resourceType?: string;
  resourceId?: string;
  createdAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
  timestamp: string;
  requestId: string;
}
