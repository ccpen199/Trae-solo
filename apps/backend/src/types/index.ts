export type OrderStatus = 
  | 'created'
  | 'reserved'
  | 'checked_in'
  | 'in_examination'
  | 'examination_completed'
  | 'report_generated'
  | 'cancelled';

export type PatientStatus = 
  | 'waiting'
  | 'in_examination'
  | 'completed'
  | 'abnormal'
  | 'locked';

export type ExaminationItemStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'abnormal';

export type NotificationType =
  | 'crisis_value'
  | 'queue_update'
  | 'report_ready'
  | 'follow_up'
  | 'system';

export interface Patient {
  id: string;
  name: string;
  gender: 'male' | 'female';
  birthDate: Date;
  idCard: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  category: 'basic' | 'standard' | 'premium' | 'custom';
  items: PackageItem[];
  isActive: boolean;
  estimatedDuration: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PackageItem {
  id: string;
  name: string;
  departmentId: string;
  itemType: 'examination' | 'lab' | 'imaging';
  estimatedDuration: number;
  normalRange?: NormalRange;
  estimatedPrice?: number;
}

export interface NormalRange {
  min?: number;
  max?: number;
  unit: string;
  gender?: 'male' | 'female';
  ageRange?: { min: number; max: number };
}

export interface Department {
  id: string;
  name: string;
  code: string;
  location: string;
  capacity: number;
  currentCount: number;
  avgExamTime: number;
  doctors: Doctor[];
  isActive: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  departmentId: string;
  title: string;
  phone: string;
  role: 'department_doctor' | 'chief_doctor';
  isActive: boolean;
}

export interface Reservation {
  id: string;
  reservationCode: string;
  patientId: string;
  packageId: string;
  orderId: string;
  reservationDate: Date;
  timeSlot: string;
  status: OrderStatus;
  checkInTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExaminationOrder {
  id: string;
  orderNo: string;
  patientId: string;
  packageId: string;
  totalAmount: number;
  paidAmount: number;
  status: OrderStatus;
  reservationId: string;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  itemName: string;
  departmentId: string;
  itemType: 'examination' | 'lab' | 'imaging';
  status: ExaminationItemStatus;
  result?: ExaminationResult;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ExaminationResult {
  id: string;
  orderItemId: string;
  patientId: string;
  doctorId: string;
  values: ResultValue[];
  conclusion: string;
  isAbnormal: boolean;
  isCrisis: boolean;
  examTime: Date;
  createdAt: Date;
}

export interface ResultValue {
  id: string;
  name: string;
  value: string;
  unit: string;
  normalRange?: string;
  isAbnormal: boolean;
}

export interface QueueItem {
  id: string;
  patientId: string;
  patientName: string;
  departmentId: string;
  orderId: string;
  reservationCode: string;
  status: PatientStatus;
  queuePosition: number;
  estimatedWaitTime: number;
  assignedDoctorId?: string;
  joinedAt: Date;
  calledAt?: Date;
  completedAt?: Date;
}

export interface ExaminationReport {
  id: string;
  reportNo: string;
  orderId: string;
  patientId: string;
  chiefDoctorId: string;
  summary: string;
  conclusions: string;
  recommendations: HealthRecommendation[];
  abnormalItems: AbnormalItem[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  isGenerated: boolean;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthRecommendation {
  id: string;
  reportId: string;
  category: 'diet' | 'exercise' | 'medication' | 'follow_up' | 'lifestyle';
  content: string;
  priority: 'low' | 'medium' | 'high';
}

export interface AbnormalItem {
  id: string;
  reportId: string;
  itemName: string;
  itemType: 'examination' | 'lab' | 'imaging';
  value: string;
  normalRange: string;
  description: string;
  isCrisis: boolean;
}

export interface FollowUpTask {
  id: string;
  taskNo: string;
  patientId: string;
  reportId: string;
  abnormalItems: string;
  riskLevel: 'medium' | 'high' | 'critical';
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'completed' | 'scheduled';
  scheduledDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  type: NotificationType;
  targetType: 'patient' | 'doctor' | 'reception' | 'admin';
  targetId: string;
  title: string;
  content: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  operation: 'create' | 'update' | 'delete' | 'login' | 'logout';
  entity: string;
  entityId: string;
  operatorId: string;
  operatorName: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface OfflineSyncRecord {
  id: string;
  deviceId: string;
  operation: 'create' | 'update';
  entity: string;
  localId: string;
  data: Record<string, unknown>;
  status: 'pending' | 'synced' | 'failed';
  attempts: number;
  errorMessage?: string;
  syncedAt?: Date;
  createdAt: Date;
}

export interface TriagePath {
  id: string;
  reservationId: string;
  patientId: string;
  currentStep: number;
  totalSteps: number;
  steps: TriageStep[];
  isCompleted: boolean;
  createdAt: Date;
}

export interface TriageStep {
  id: string;
  stepIndex: number;
  departmentId: string;
  departmentName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  estimatedStartTime?: Date;
  actualStartTime?: Date;
  completedAt?: Date;
  queuePosition?: number;
}
