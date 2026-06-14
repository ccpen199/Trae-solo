export type PatientType = 'elderly' | 'maternal' | 'post-hospital' | 'hospice';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type OrderStatus =
  | 'created'
  | 'risk-assessed'
  | 'dispatched'
  | 'nurse-accepted'
  | 'in-service'
  | 'completed'
  | 'cancelled';
export type VerifyStatus = 'pending' | 'verifying' | 'verified' | 'rejected';
export type AuditStage = 'self-check' | 'quality-control' | 'platform-check';
export type AuditResult = 'approved' | 'rejected' | 'pending';
export type RiskType =
  | 'out-of-scope'
  | 'no-check-in'
  | 'recording-interrupt'
  | 'data-mismatch'
  | 'overtime'
  | 'complaint';
export type TicketStatus = 'open' | 'investigating' | 'resolved' | 'closed';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type PolicyStatus = 'pending' | 'active' | 'expired' | 'claimed';
export type ClaimStatus = 'none' | 'applied' | 'processing' | 'approved' | 'rejected';
export type UserRole =
  | 'platform-admin'
  | 'org-admin'
  | 'quality-officer'
  | 'nurse'
  | 'patient';

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VerifyHistoryItem {
  id: string;
  type: 'system' | 'manual';
  action: 'submit' | 'system-check' | 'approve' | 'reject' | 're-submit';
  operatorId?: string;
  operatorName?: string;
  operatorRole?: string;
  remark?: string;
  systemCheckItems?: {
    key: string;
    label: string;
    passed: boolean;
    message: string;
  }[];
  time: string;
}

export interface Nurse {
  id: string;
  name: string;
  phone: string;
  idCard: string;
  avatar?: string;
  certificateNumber: string;
  certificateType: '执业护士' | '执业医师' | '助产士';
  practiceScope: string[];
  certificateImage: string;
  verifyStatus: VerifyStatus;
  verifyResult?: {
    systemChecked: boolean;
    systemMessage?: string;
    systemCheckItems?: {
      key: string;
      label: string;
      passed: boolean;
      message: string;
    }[];
    manualChecked: boolean;
    manualRemark?: string;
    manualReviewerId?: string;
    manualReviewerName?: string;
    manualReviewTime?: string;
  };
  verifyHistory: VerifyHistoryItem[];
  validUntil: string;
  organizationId: string;
  organizationName: string;
  createdAt: string;
  rating: number;
  completedOrders: number;
}

export type RiskAssessmentStatus = 'not-triggered' | 'triggered' | 'in-progress' | 'completed';
export type RecordingStatus = 'not-started' | 'recording' | 'paused' | 'completed' | 'interrupted';
export type DataBindingStatus = 'not-bound' | 'partial' | 'fully-bound';

export interface ServiceOrder {
  id: string;
  orderNo: string;
  patientType: PatientType;
  patientInfo: {
    name: string;
    age: number;
    gender: 'male' | 'female';
    phone: string;
    address: string;
    diagnosis?: string;
    allergies?: string[];
  };
  serviceItems: { code: string; name: string; duration: number; price: number }[];
  riskLevel: RiskLevel;
  riskAssessmentId?: string;
  riskAssessmentStatus: RiskAssessmentStatus;
  nurseId?: string;
  nurseInfo?: Partial<Nurse>;
  scheduledTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  status: OrderStatus;
  auditStatus:
    | 'not-submitted'
    | 'self-check'
    | 'quality-control'
    | 'platform-check'
    | 'all-passed';
  hasInsurance: boolean;
  insuranceStatus: PolicyStatus;
  policyId?: string;
  policyNo?: string;
  recordingStatus: RecordingStatus;
  recordingId?: string;
  serviceRecordId?: string;
  dataBindingStatus: DataBindingStatus;
  hasNursingNotes: boolean;
  hasMedicationList: boolean;
  hasVitalSigns: boolean;
  totalAmount: number;
  createdAt: string;
  distanceKm?: number;
}

export interface RiskQuestion {
  id: string;
  category: PatientType | 'general';
  question: string;
  options: { label: string; score: number }[];
}

export interface RiskAssessment {
  id: string;
  orderId: string;
  patientType: PatientType;
  answers: { questionId: string; optionIndex: number }[];
  totalScore: number;
  riskLevel: RiskLevel;
  suggestions?: string;
  createdAt: string;
}

export interface VitalSign {
  temperature?: number;
  heartRate?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  respiratoryRate?: number;
  oxygenSaturation?: number;
  bloodGlucose?: number;
  recordedAt: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  administered: boolean;
  remark?: string;
}

export interface NursingNote {
  content: string;
  images?: string[];
  signature: string;
  createdAt: string;
}

export interface ServiceRecord {
  id: string;
  orderId: string;
  checkIn: { time: string; gps: [number, number]; photo?: string } | null;
  checkOut: { time: string; gps: [number, number] } | null;
  recording: {
    audioUrl?: string;
    videoUrl?: string;
    encryptedHash: string;
    startTime: string;
    endTime?: string;
    duration: number;
    hasInterruptions: boolean;
  } | null;
  vitalSigns: VitalSign[];
  medicationList: Medication[];
  nursingNotes: NursingNote[];
  dataBindingVerified: boolean;
}

export interface AuditTask {
  id: string;
  orderId: string;
  orderNo: string;
  patientName: string;
  nurseName: string;
  stage: AuditStage;
  auditorId?: string;
  auditorName?: string;
  result: AuditResult;
  remarks?: string;
  attachments?: string[];
  startedAt: string;
  completedAt?: string;
  priority: 'normal' | 'high' | 'urgent';
}

export interface RiskTicket {
  id: string;
  ticketNo: string;
  orderId: string;
  orderNo: string;
  nurseId?: string;
  nurseName?: string;
  riskType: RiskType;
  severity: Severity;
  description: string;
  evidence: { type: string; url: string; description?: string }[];
  status: TicketStatus;
  assigneeId?: string;
  assigneeName?: string;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface InsurancePolicy {
  id: string;
  policyNo: string;
  orderId: string;
  orderNo: string;
  insurerName: string;
  productName: string;
  insuredName: string;
  insuredIdCard?: string;
  premium: number;
  coverage: number;
  period: { start: string; end: string };
  status: PolicyStatus;
  claimStatus?: ClaimStatus;
  createdAt: string;
  nurseName?: string;
}

export interface DashboardStats {
  todayOrders: number;
  todayOrdersTrend: number;
  inService: number;
  activeNurses: number;
  activeNursesTrend: number;
  riskAlerts: number;
  pendingAudits: number;
  revenueToday: number;
  revenueTrend: number;
  verifiedNurses: number;
  totalNurses: number;
  complianceRate: number;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  organizationName?: string;
  phone?: string;
}
