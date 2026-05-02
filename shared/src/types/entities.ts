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
} from './enums';

export interface User {
  id: string;
  username: string;
  password: string;
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
  updatedAt: Date;
}

export interface Department {
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
  updatedAt: Date;
}

export interface Doctor {
  id: string;
  userId: string;
  departmentId: string;
  title: DoctorTitle;
  specialties: string[];
  introduction?: string;
  consultationFee: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  department?: Department;
}

export interface Schedule {
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
  updatedAt: Date;
  doctor?: Doctor;
  department?: Department;
}

export interface TimeSlot {
  id: string;
  scheduleId: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  appointmentId?: string;
  lockedBy?: string;
  lockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  schedule?: Schedule;
}

export interface Appointment {
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
  updatedAt: Date;
  patient?: User;
  doctor?: Doctor;
  department?: Department;
  schedule?: Schedule;
  slot?: TimeSlot;
  registration?: Registration;
  payment?: Payment;
}

export interface Registration {
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
  updatedAt: Date;
  patient?: User;
  doctor?: Doctor;
  department?: Department;
  schedule?: Schedule;
  slot?: TimeSlot;
  appointment?: Appointment;
  payment?: Payment;
  queue?: QueueItem;
}

export interface Payment {
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
  updatedAt: Date;
  patient?: User;
  registration?: Registration;
  appointment?: Appointment;
  refunds?: Refund[];
}

export interface Refund {
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
  updatedAt: Date;
  payment?: Payment;
  processor?: User;
}

export interface QueueItem {
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
  updatedAt: Date;
  registration?: Registration;
  doctor?: Doctor;
  department?: Department;
}

export interface AuditLog {
  id: string;
  module: string;
  action: string;
  userId: string;
  userName: string;
  userRole: string;
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
  user?: User;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description?: string;
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
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
  user?: User;
}
