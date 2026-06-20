export interface InterviewSummary {
  id: string;
  keywords: string[];
  satisfaction: 1 | 2 | 3 | 4 | 5;
  summary: string;
  recordedAt: string;
}

export interface SafetyRecord {
  id: string;
  date: string;
  type: 'incident' | 'audit' | 'training';
  level: 'normal' | 'minor' | 'major';
  description: string;
}

export type EhsRating = 'A' | 'B' | 'C' | 'D';
export type WhitelistStatus = 'whitelist' | 'graylist' | 'blacklist';

export interface Factory {
  id: string;
  name: string;
  logo: string;
  region: string;
  address: string;
  ehsRating: EhsRating;
  ehsScore: number;
  dailyCapacity: number;
  capacityUtilization: number;
  seasonNote: string;
  interviewSummaries: InterviewSummary[];
  safetyRecords: SafetyRecord[];
  whitelistStatus: WhitelistStatus;
  createdAt: string;
  industry: string;
  scale: string;
}

export interface ProcessNode {
  step: number;
  name: string;
  description: string;
  duration: string;
}

export type JobStatus = 'draft' | 'reviewing' | 'published' | 'closed';

export interface Job {
  id: string;
  factoryId: string;
  title: string;
  salaryRange: { min: number; max: number };
  workHours: string;
  overtimeRule: string;
  overtimeRate: { weekday: number; weekend: number; holiday: number };
  board: { provided: boolean; costPerMonth?: number };
  lodging: { provided: boolean; costPerMonth?: number; roomType?: string };
  processNodes: ProcessNode[];
  requirements: string[];
  benefits: string[];
  status: JobStatus;
  vacancy: number;
  distanceKm?: number;
  createdAt: string;
  urgent?: boolean;
  highSubsidy?: boolean;
}

export interface SkillCert {
  name: string;
  issuer: string;
  certifiedAt: string;
}

export type LeaveType = 'normal' | 'abnormal' | 'fired';

export interface PerformanceRecord {
  factoryId: string;
  factoryName: string;
  jobId: string;
  jobTitle: string;
  startDate: string;
  endDate?: string;
  daysWorked: number;
  leaveType?: LeaveType;
  leaveReason?: string;
}

export type WorkerStatus = 'idle' | 'interviewing' | 'onboarding' | 'employed' | 'resigned';

export interface Worker {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  idCardVerified: boolean;
  idCardOcrData?: { name: string; idNumber: string; address: string };
  skills: SkillCert[];
  performanceHistory: PerformanceRecord[];
  creditScore: number;
  currentLocation: { lat: number; lng: number; region: string };
  status: WorkerStatus;
  createdAt: string;
  gender?: 'male' | 'female';
  age?: number;
}

export interface Broker {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  bindRegion: string;
  serviceRating: number;
  orderWeight: number;
  totalOrders: number;
  completedOrders: number;
  tags: string[];
}

export interface PickupInfo {
  carPlate: string;
  driverName: string;
  driverPhone: string;
  pickupTime: string;
  pickupPoint: string;
}

export interface TimelineEvent {
  time: string;
  type: string;
  description: string;
  operator?: string;
}

export type InterviewStatus =
  | 'pending'
  | 'broker_assigned'
  | 'pickup_scheduled'
  | 'arrived'
  | 'documents_copied'
  | 'training_done'
  | 'interviewing'
  | 'passed'
  | 'failed'
  | 'employed';

export interface InterviewOrder {
  id: string;
  workerId: string;
  workerName: string;
  workerPhone: string;
  jobId: string;
  jobTitle: string;
  factoryId: string;
  factoryName: string;
  brokerId?: string;
  brokerName?: string;
  scheduledDate: string;
  status: InterviewStatus;
  pickupInfo?: PickupInfo;
  timeline: TimelineEvent[];
  subsidy?: { triggered: boolean; amount: number; paidAt?: string; daysRequired: number; daysCompleted: number };
  referralBonus?: { triggered: boolean; amount: number; referrerId?: string; referrerName?: string; paidAt?: string };
  serviceFee?: number;
  createdAt: string;
}

export type RiskLevel = 'high' | 'medium' | 'low';
export type Trend = 'up' | 'down' | 'stable';

export interface ResignWarning {
  id: string;
  factoryId: string;
  factoryName: string;
  riskLevel: RiskLevel;
  riskScore: number;
  recentResignCount: number;
  resignRate: number;
  trend: Trend;
  topReasons: { reason: string; count: number }[];
  keywords: string[];
  suggestion: string;
  reportedAt: string;
}

export interface RegionHeatmap {
  regionCode: string;
  regionName: string;
  saturation: number;
  vacancyCount: number;
  jobSeekerCount: number;
  avgSalary: number;
  x: number;
  y: number;
  path?: string;
}

export type UserRole = 'worker' | 'broker' | 'factory' | 'admin';

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  avatar?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}

export interface CreditDistribution {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
  veryPoor: number;
  ranges: { label: string; min: number; max: number; count: number }[];
}
