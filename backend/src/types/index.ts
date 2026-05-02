export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  MEMBER = 'member',
  RECEPTIONIST = 'receptionist',
  TRAINER = 'trainer',
  SALES_MANAGER = 'sales_manager',
  ADMIN = 'admin'
}

export interface Member {
  id: string;
  userId: string;
  cardNumber: string;
  status: MemberStatus;
  joinDate: Date;
  expiryDate: Date | null;
  remainingVisits: number;
  totalVisits: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum MemberStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  FROZEN = 'frozen'
}

export interface Package {
  id: string;
  name: string;
  type: PackageType;
  totalSessions: number;
  price: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum PackageType {
  TIME_CARD = 'time_card',
  SESSION_CARD = 'session_card',
  MEMBERSHIP = 'membership'
}

export interface MemberPackage {
  id: string;
  memberId: string;
  packageId: string;
  totalSessions: number;
  remainingSessions: number;
  purchaseDate: Date;
  expiryDate: Date;
  status: MemberPackageStatus;
  businessOrderId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum MemberPackageStatus {
  ACTIVE = 'active',
  USED_UP = 'used_up',
  EXPIRED = 'expired'
}

export interface Course {
  id: string;
  name: string;
  description: string;
  trainerId: string;
  capacity: number;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Schedule {
  id: string;
  courseId: string;
  trainerId: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
  bookedCount: number;
  status: ScheduleStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum ScheduleStatus {
  SCHEDULED = 'scheduled',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Reservation {
  id: string;
  memberId: string;
  scheduleId: string;
  status: ReservationStatus;
  businessOrderId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export interface CheckIn {
  id: string;
  memberId: string;
  checkInTime: Date;
  checkOutTime: Date | null;
  status: CheckInStatus;
  businessOrderId: string;
  createdBy: string;
  createdAt: Date;
}

export enum CheckInStatus {
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out'
}

export interface Verification {
  id: string;
  memberId: string;
  scheduleId: string;
  reservationId: string;
  trainerId: string;
  sessionsDeducted: number;
  rating: number | null;
  comment: string | null;
  businessOrderId: string;
  createdBy: string;
  createdAt: Date;
}

export interface WorkOrder {
  id: string;
  memberId: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  assignedTo: string;
  description: string;
  result: string | null;
  businessOrderId: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum WorkOrderType {
  RENEWAL = 'renewal',
  RECALL = 'recall'
}

export enum WorkOrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  businessOrderId: string;
  operatorId: string;
  operatorRole: string;
  oldValue: string | null;
  newValue: string;
  details: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  memberId: string;
  type: TransactionType;
  amount: number;
  sessions: number;
  referenceType: string;
  referenceId: string;
  businessOrderId: string;
  operatorId: string;
  description: string;
  createdAt: Date;
}

export enum TransactionType {
  PURCHASE = 'purchase',
  DEDUCTION = 'deduction',
  REFUND = 'refund',
  ADDITION = 'addition'
}

export interface TrainerPerformance {
  id: string;
  trainerId: string;
  date: Date;
  totalSessions: number;
  completedSessions: number;
  revenue: number;
  avgRating: number;
  createdAt: Date;
}

export interface RetentionScan {
  id: string;
  scanDate: Date;
  memberId: string;
  lastVisitDate: Date;
  daysSinceLastVisit: number;
  riskLevel: RiskLevel;
  generatedWorkOrderId: string | null;
  createdAt: Date;
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}
