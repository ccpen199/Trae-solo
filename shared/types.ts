export type UserIdType = 'personal' | 'enterprise' | 'government';

export interface User {
  id: string;
  idType: UserIdType;
  realName: string;
  idCardNo?: string;
  phone: string;
  avatar?: string;
  email?: string;
  roles: string[];
  authLevel: number;
  verified: boolean;
  createdAt: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface DataConsent {
  id: string;
  userId: string;
  dataScope: string[];
  purpose: string;
  validFrom: string;
  validTo?: string;
  status: 'active' | 'expired' | 'revoked';
  createdAt: string;
}

export interface Certificate {
  id: string;
  userId: string;
  certType: string;
  certTypeName: string;
  certNo: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  status: 'valid' | 'expired' | 'revoked';
  metadata: Record<string, any>;
  qrCode: string;
  verifyUrl: string;
  category: string;
}

export interface ProgressStep {
  stepNo: number;
  name: string;
  status: 'pending' | 'current' | 'completed' | 'skipped' | 'failed';
  time?: string;
  operator?: string;
  remark?: string;
  department?: string;
}

export interface ProgressItem {
  id: string;
  serviceName: string;
  serviceType: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  currentStep: number;
  totalSteps: number;
  steps: ProgressStep[];
  submitTime: string;
  estimatedTime?: string;
}

export interface Policy {
  id: string;
  title: string;
  category: string;
  source: string;
  publishDate: string;
  summary: string;
  matchScore: number;
  eligibility: string[];
  applyUrl?: string;
  tags: string[];
  viewCount: number;
}

export interface EnterpriseInfo {
  id: string;
  name: string;
  creditCode: string;
  legalPerson: string;
  establishDate: string;
  status: 'active' | 'deregistered' | 'abnormal';
  industry: string;
  registeredAddress: string;
  businessScope: string;
  lifecycleStage: string;
}

export interface LifecycleNode {
  id: string;
  name: string;
  type: 'milestone' | 'service' | 'event';
  status: 'completed' | 'current' | 'upcoming';
  date?: string;
  services?: string[];
  description?: string;
}

export interface SubsidyPolicy {
  id: string;
  name: string;
  category: string;
  amount: string;
  eligibility: string[];
  applicationPeriod: { start: string; end: string };
  requiredMaterials: string[];
  processSteps: string[];
  description: string;
  active: boolean;
}

export interface BusArrival {
  lineName: string;
  stationName: string;
  direction: string;
  nextBus: { plateNo: string; eta: number; distance: number };
  followingBuses?: { plateNo: string; eta: number }[];
}

export interface MetroLine {
  id: string;
  name: string;
  color: string;
  stations: MetroStation[];
  firstTrain: string;
  lastTrain: string;
}

export interface MetroStation {
  id: string;
  name: string;
  transferLines: string[];
  exitCount: number;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  fee: number;
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  specialty: string;
  availableSlots: TimeSlot[];
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  todayAvailable: number;
  tomorrowAvailable: number;
  doctors: Doctor[];
}

export interface Hospital {
  id: string;
  name: string;
  level: string;
  address: string;
  phone: string;
  longitude?: number;
  latitude?: number;
  departments: Department[];
}

export interface Venue {
  id: string;
  name: string;
  type: 'stadium' | 'library' | 'museum' | 'theater' | 'community';
  address: string;
  capacity: number;
  currentOccupancy: number;
  openingHours: string;
  phone: string;
  todayActivities: Activity[];
}

export interface Activity {
  id: string;
  name: string;
  time: string;
  type: string;
  available: boolean;
  capacity: number;
  booked: number;
}

export interface PopulationProfile {
  total: number;
  ageDistribution: { range: string; count: number; percentage: number }[];
  genderDistribution: { male: number; female: number; malePercentage: number; femalePercentage: number };
  householdDistribution: { local: number; nonLocal: number; localPercentage: number; nonLocalPercentage: number };
  educationDistribution: { level: string; count: number; percentage: number }[];
  employmentRate: number;
  yearOverYearGrowth: number;
}

export interface AppealCluster {
  id: string;
  category: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  hotWords: string[];
  locations: { area: string; count: number }[];
  avgResolutionTime: number;
  satisfactionRate: number;
}

export interface EventHistoryItem {
  action: string;
  operator: string;
  time: string;
  remark?: string;
}

export interface GridEvent {
  id: string;
  gridId: string;
  gridName: string;
  type: string;
  typeIcon: string;
  description: string;
  reporter: string;
  reporterPhone?: string;
  reportTime: string;
  status: 'reported' | 'assigned' | 'processing' | 'resolved' | 'closed';
  assignee?: string;
  assignedTime?: string;
  resolvedTime?: string;
  closedTime?: string;
  latitude?: number;
  longitude?: number;
  images?: string[];
  history: EventHistoryItem[];
  priority: 'low' | 'medium' | 'high';
}

export interface Grid {
  id: string;
  code: string;
  name: string;
  area: string;
  population: number;
  households: number;
  eventCount: number;
  unresolvedCount: number;
  boundary?: number[][];
}

export interface FlowStep {
  id: string;
  name: string;
  department: string;
  apiEndpoint: string;
  dependsOn: string[];
  parallel: boolean;
  requiredData: string[];
}

export interface OneStopService {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requiredMaterials: string[];
  involvedDepartments: string[];
  estimatedDays: number;
  flowSteps: FlowStep[];
  active: boolean;
}

export interface FlowStepInstance {
  stepId: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  result?: any;
  error?: string;
  department?: string;
}

export interface OrchestrationInstance {
  instanceId: string;
  serviceId: string;
  serviceName: string;
  status: 'running' | 'completed' | 'failed';
  steps: FlowStepInstance[];
  startTime: string;
  endTime?: string;
  overallProgress: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: number;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type LoginProvider = 'password' | 'minzhengtong' | 'wechat' | 'alipay';

export interface LoginRequest {
  provider: LoginProvider;
  phone?: string;
  password?: string;
  code?: string;
  state?: string;
}
