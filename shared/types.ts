export type UserRole = 'student' | 'investor' | 'admin';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface LoginRequest {
  account: string;
  password: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
}

export interface StudentAccount {
  id: string;
  userId: string;
  studentNo: string;
  name: string;
  balance: number;
  campusCardId: string;
  phone: string;
}

export interface InvestorAccount {
  id: string;
  userId: string;
  companyName: string;
  totalRevenue: number;
  availableBalance: number;
  shareRatio: number;
}

export type ConnectionType = 'nfc' | 'bluetooth' | 'qr';
export type DeviceStatus = 'online' | 'offline' | 'fault';

export interface Device {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  status: DeviceStatus;
  connectionTypes: ConnectionType[];
  queueCount: number;
  todayWaterUsage: number;
  todayRevenue: number;
  totalWaterUsage: number;
  totalRevenue: number;
  investorId: string;
  lastOnline: number;
  createdAt: number;
}

export interface DeviceWithDistance extends Device {
  distance: number;
}

export interface WaterTransaction {
  id: string;
  studentId: string;
  deviceId: string;
  startTime: number;
  endTime?: number;
  volume: number;
  amount: number;
  hash: string;
  prevHash: string | null;
  syncedToCampus: boolean;
  deviceName?: string;
  deviceLocation?: string;
}

export type PaymentChannel = 'alipay' | 'wechat';
export type PaymentStatus = 'pending' | 'success' | 'failed';

export interface RechargeRecord {
  id: string;
  studentId: string;
  amount: number;
  channel: PaymentChannel;
  status: PaymentStatus;
  externalTransactionId: string | null;
  createdAt: number;
  paidAt: number | null;
}

export interface RevenueRecord {
  id: string;
  investorId: string;
  deviceId: string;
  period: string;
  totalRevenue: number;
  investorShare: number;
  platformShare: number;
  settled: boolean;
  settledAt: number | null;
  created_at: number;
  deviceName?: string;
}

export type DiagnosisStatus = 'normal' | 'warning' | 'critical';

export interface DiagnosisIssue {
  code: string;
  description: string;
  suggestion: string;
}

export interface DiagnosisMetrics {
  waterPressure: number;
  temperature: number;
  batteryLevel: number;
  signalStrength: number;
}

export interface DeviceDiagnosis {
  id: string;
  deviceId: string;
  timestamp: number;
  status: DiagnosisStatus;
  issues: DiagnosisIssue[];
  metrics: DiagnosisMetrics;
}

export interface SemesterSummary {
  semester: string;
  totalVolume: number;
  totalAmount: number;
  transactionCount: number;
  averagePerTransaction: number;
  monthlyBreakdown: { month: string; volume: number; amount: number }[];
}
