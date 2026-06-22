export interface UserInfo {
  id: string;
  name: string;
  idCard: string;
  socialSecurityNo: string;
  insuredArea: string;
  avatar?: string;
}

export interface AuthRequest {
  credentialType: 'qrcode' | 'face';
  credentialData: string;
  deviceId: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  userInfo: UserInfo;
  expiresAt: number;
}

export interface AccountBalance {
  personalAccount: number;
  overallAccount: number;
  annualConsumption: number;
  monthlyConsumption: number;
  lastUpdated: string;
}

export interface ConsumptionDetail {
  name: string;
  spec: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  insuranceType: string;
}

export interface ConsumptionRecord {
  id: string;
  date: string;
  type: 'hospital' | 'pharmacy' | 'drug';
  merchantName: string;
  amount: number;
  personalPay: number;
  overallPay: number;
  category: string;
  details: ConsumptionDetail[];
}

export interface AccountStatistics {
  monthlyData: { month: string; amount: number }[];
  categoryData: { category: string; amount: number; percentage: number }[];
}

export interface Prescription {
  drugName: string;
  spec: string;
  dosage: string;
  frequency: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  insuranceCoverage: string;
}

export interface Examination {
  name: string;
  type: string;
  result: string;
  amount: number;
  insuranceCoverage: string;
}

export interface MedicalRecord {
  id: string;
  visitDate: string;
  hospital: string;
  hospitalId: string;
  department: string;
  doctor: string;
  diagnosis: string[];
  symptoms: string;
  prescriptions: Prescription[];
  examinations: Examination[];
  cost: {
    total: number;
    overallPay: number;
    personalPay: number;
    accountPay: number;
    selfPay: number;
  };
}

export interface ChronicDisease {
  id: string;
  diseaseType: string;
  diseaseName: string;
  confirmedDate: string;
  expiryDate: string;
  status: 'approved' | 'pending' | 'rejected' | 'expired';
  materials?: string[];
  approvalNotes?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface Hospital {
  id: string;
  name: string;
  level: string;
  area: string;
  address: string;
  isInsurancePoint: boolean;
  longitude: number;
  latitude: number;
  departments: Department[];
  distance?: number;
  insurancePolicy: {
    reimbursementRate: number;
    deductible: number;
    maxReimbursement: number;
  };
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  department: string;
  departmentId: string;
  specialty: string;
  avatar?: string;
  registrationFee: number;
  availableDates: string[];
}

export interface TimeSlot {
  id: string;
  time: string;
  period: 'morning' | 'afternoon' | 'evening';
  available: number;
  total: number;
  status: 'available' | 'limited' | 'full';
}

export interface Appointment {
  id: string;
  hospital: string;
  hospitalId: string;
  department: string;
  departmentId: string;
  doctor: string;
  doctorId: string;
  date: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  medicalCode: string;
  qrCode: string;
  registrationFee: number;
  createdAt: string;
}

export interface SettlementItem {
  name: string;
  spec: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  insuranceType: string;
  insurancePay: number;
  selfPay: number;
}

export interface SettlementOrder {
  id: string;
  type: 'outpatient' | 'inpatient';
  hospital: string;
  hospitalId: string;
  appointmentId?: string;
  amount: {
    total: number;
    overallPay: number;
    accountPay: number;
    wechatPay?: number;
    alipayPay?: number;
    selfPay: number;
  };
  items: SettlementItem[];
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
  paidAt?: string;
  transactionId?: string;
}

export interface PaymentRequest {
  orderId: string;
  useAccount: boolean;
  additionalMethod: 'wechat' | 'alipay' | 'none';
  amount: number;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  paidAmount: number;
  electronicReceiptUrl: string;
  settlementNoteUrl: string;
}

export type NotificationType = 'treatment_abnormal' | 'policy' | 'record_failure' | 'system';
export type NotificationLevel = 'info' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  level: NotificationLevel;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  retryable?: boolean;
}

export interface RemoteRecordStatus {
  id: string;
  status: 'success' | 'failed' | 'pending';
  area: string;
  hospital: string;
  attemptCount: number;
  nextRetryAt?: string;
  errorMessage?: string;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
