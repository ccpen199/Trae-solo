export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface UserIdentity {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  email?: string;
  avatar?: string;
  realNameVerified: boolean;
  faceVerified: boolean;
  role: 'citizen' | 'enterprise' | 'admin' | 'clerk';
}

export interface LoginResponse {
  token: string;
  user: UserIdentity;
}

export type CertificateType = 'id_card' | 'social_security' | 'driving_license' | 'vehicle_license' | 'ebike_plate';

export interface DigitalCertificate {
  id: string;
  type: CertificateType;
  number: string;
  name: string;
  issueDate: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'revoked';
  qrCode?: string;
  metadata?: Record<string, any>;
}

export interface ServiceRequest {
  id: string;
  serviceType: string;
  serviceCode: string;
  userId: string;
  params: Record<string, any>;
  responseData?: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amount: number;
  createdAt: string;
  completedAt?: string;
}

export interface DataAuditInfo {
  dataSource: string;
  collectedAt: string;
  verifiedAt: string;
  verifyStatus: 'normal' | 'warning' | 'error';
  abnormalMark?: string;
  confidence: number;
}

export interface CityVitalSigns {
  timestamp: string;
  transportation: {
    busOnTimeRate: number;
    trafficFlow: number;
    parkingOccupancy: number;
  };
  medical: {
    hospitalWaitTimes: Record<string, number>;
    emergencyLoad: number;
  };
  utilities: {
    waterUsage: number;
    electricityUsage: number;
    gasUsage: number;
  };
  education: {
    schoolEnrollment: number;
  };
  urbanManagement: {
    openTickets: number;
    resolutionRate: number;
  };
}

export interface BusOnTimeTrendItem {
  hour: number;
  onTimeRate: number;
  audit: DataAuditInfo;
}

export interface BusRouteRankingItem {
  routeName: string;
  onTimeRate: number;
  totalTrips: number;
  delayedTrips: number;
  audit: DataAuditInfo;
}

export interface TrafficHeatmapItem {
  area: string;
  flow: number;
  congestionLevel: number;
  audit: DataAuditInfo;
}

export interface BRTPassengerStats {
  lineName: string;
  passengerCount: number;
  peakHour: string;
  averageLoadFactor: number;
  audit: DataAuditInfo;
}

export interface TransportationDashboardData {
  busOnTimeTrend: BusOnTimeTrendItem[];
  busRouteRanking: BusRouteRankingItem[];
  trafficHeatmap: TrafficHeatmapItem[];
  brtPassengerStats: BRTPassengerStats[];
}

export interface HospitalWaitHeatmapItem {
  department: string;
  timeSlot: string;
  waitTime: number;
  audit: DataAuditInfo;
}

export interface HospitalEmergencyLoadItem {
  hospitalName: string;
  loadRate: number;
  waitingPatients: number;
  availableBeds: number;
  audit: DataAuditInfo;
}

export interface AppointmentStatsItem {
  date: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  audit: DataAuditInfo;
}

export interface MedicalDashboardData {
  waitHeatmap: HospitalWaitHeatmapItem[];
  emergencyLoad: HospitalEmergencyLoadItem[];
  appointmentStats: AppointmentStatsItem[];
}

export interface UtilitiesDetailItem {
  hour: number;
  usage: number;
  audit: DataAuditInfo;
}

export interface UtilitiesComparison {
  todayTotal: number;
  yesterdayTotal: number;
  lastMonthTotal: number;
  comparedYesterday: number;
  comparedLastMonth: number;
  audit: DataAuditInfo;
}

export interface UtilitiesDashboardData {
  waterUsage: UtilitiesDetailItem[];
  electricityUsage: UtilitiesDetailItem[];
  gasUsage: UtilitiesDetailItem[];
  waterComparison: UtilitiesComparison;
  electricityComparison: UtilitiesComparison;
  gasComparison: UtilitiesComparison;
}

export interface TicketCategoryItem {
  category: string;
  count: number;
  percentage: number;
  audit: DataAuditInfo;
}

export interface ClassificationAccuracyTrendItem {
  date: string;
  accuracy: number;
  totalTickets: number;
  audit: DataAuditInfo;
}

export interface DepartmentEfficiencyItem {
  department: string;
  avgProcessingTime: number;
  completedTickets: number;
  pendingTickets: number;
  audit: DataAuditInfo;
}

export interface TicketStatusItem {
  status: string;
  count: number;
  percentage: number;
  audit: DataAuditInfo;
}

export interface GovernmentDashboardData {
  ticketCategoryDistribution: TicketCategoryItem[];
  classificationAccuracyTrend: ClassificationAccuracyTrendItem[];
  departmentEfficiency: DepartmentEfficiencyItem[];
  ticketStatusDistribution: TicketStatusItem[];
}

export type DashboardTab = 'overview' | 'transportation' | 'medical' | 'utilities' | 'government';

export type TicketCategory = 'transportation' | 'medical' | 'education' | 'government' | 'urban_management';
export type TicketStatus = 'pending' | 'assigned' | 'processing' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TicketLog {
  id: string;
  ticketId: string;
  action: string;
  description: string;
  operator: string;
  department: string;
  timestamp: string;
}

export interface ComplaintTicket {
  id: string;
  ticketNo: string;
  title: string;
  content: string;
  category: TicketCategory;
  subCategory?: string;
  department: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId?: string;
  assigneeName?: string;
  deadline: string;
  resolution?: string;
  satisfactionScore?: number;
  satisfactionComment?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  logs?: TicketLog[];
}

export interface PolicySection {
  id: string;
  title: string;
  level: number;
  content: string;
  keyPoints?: string[];
}

export interface PolicyPushRecord {
  id: string;
  policyId: string;
  policyTitle: string;
  category: string;
  pushTime: string;
  pushType: 'system' | 'subscription' | 'recommendation';
  read: boolean;
}

export interface PolicyDocument {
  id: string;
  title: string;
  category: string;
  publishDate: string;
  content: string;
  structuredContent: PolicySection[];
  aiInterpretation?: string;
  tags: string[];
  viewCount?: number;
  relatedPolicies?: string[];
}

export interface AtomicService {
  id: string;
  serviceCode: string;
  name: string;
  description: string;
  category: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  requestSchema?: Record<string, any>;
  responseSchema?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  stats?: {
    callCount: number;
    avgDuration: number;
    successRate: number;
  };
  dependencies?: { source: string; target: string; label: string }[];
  recentCalls?: ServiceCallRecord[];
  properties?: FlowNodeProperty[];
}

export interface FlowReleaseRecord {
  id: string;
  flowId: string;
  version: string;
  releaseTime: string;
  publisher: string;
  publisherId: string;
  changeLog: string;
  status: 'success' | 'rollback' | 'processing' | 'failed';
  flowDefinitionSnapshot: Record<string, any>;
}

export interface ServiceStats {
  serviceId: string;
  callCount: number;
  avgDuration: number;
  successRate: number;
  errorCount: number;
  lastCallTime: string;
}

export interface ServiceCallRecord {
  id: string;
  serviceId: string;
  serviceName: string;
  callTime: string;
  duration: number;
  status: 'success' | 'failed';
  params?: Record<string, any>;
  result?: Record<string, any>;
  caller?: string;
}

export interface ServiceDependency {
  source: string;
  target: string;
  label: string;
}

export interface FlowNodeProperty {
  key: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea';
  required: boolean;
  value?: any;
  options?: Array<{ label: string; value: any }>;
  description?: string;
}

export interface OrchestrationFlow {
  id: string;
  name: string;
  description?: string;
  flowDefinition: Record<string, any>;
  triggerServiceId?: string;
  isEnabled: boolean;
  createdAt: string;
  currentVersion?: string;
  lastReleaseTime?: string;
  lastPublisher?: string;
  releaseRecords?: FlowReleaseRecord[];
  stats?: {
    executionCount: number;
    successRate: number;
    avgDuration: number;
  };
}

export interface ParkingLot {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  totalSpaces: number;
  availableSpaces: number;
  pricePerHour: number;
  distance?: number;
  phone?: string;
  openHours?: string;
  parkingType?: string;
  facilities?: string[];
  rating?: number;
  reviews?: number;
}

export interface Hospital {
  id: string;
  name: string;
  level: string;
  address: string;
  departments: Department[];
}

export interface Department {
  id: string;
  name: string;
  waitTime: number;
  doctors: Doctor[];
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  available: boolean;
  rating?: number;
  consultationCount?: number;
  specialty?: string;
}

export interface AppointmentRecord {
  id: string;
  hospitalId: string;
  hospitalName: string;
  departmentId: string;
  departmentName: string;
  doctorId: string;
  doctorName: string;
  doctorTitle: string;
  date: string;
  time: string;
  status: 'pending' | 'completed' | 'cancelled' | 'no_show';
  appointmentNo: string;
  createdAt: string;
}

export interface SchoolDistrictResult {
  schoolId: string;
  schoolName: string;
  schoolType: string;
  distance: number;
  address: string;
  district: string;
  enrollmentQuota: number;
}

export interface TrafficViolation {
  id: string;
  plateNumber: string;
  violationType: string;
  location: string;
  time: string;
  fine: number;
  points: number;
  status: 'unpaid' | 'paid' | 'appealing';
  description?: string;
  cameraLocation?: string;
}

export interface BRTTravelRecord {
  id: string;
  routeName: string;
  startStation: string;
  endStation: string;
  startTime: string;
  endTime: string;
  fare: number;
  status: 'completed' | 'in_progress' | 'refunded';
  paymentMethod: string;
}

export interface School {
  id: string;
  name: string;
  type: 'primary' | 'middle' | 'high';
  address: string;
  district: string;
}

export interface EnrollmentApplication {
  id: string;
  childName: string;
  childIdCard: string;
  schoolId: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  reviewComment?: string;
  createdAt: string;
}

export const CERTIFICATE_TYPE_MAP: Record<CertificateType, { name: string; color: string; icon: string }> = {
  id_card: { name: '居民身份证', color: '#0066CC', icon: 'IdCard' },
  social_security: { name: '社会保障卡', color: '#22AA66', icon: 'CreditCard' },
  driving_license: { name: '机动车驾驶证', color: '#FF8833', icon: 'Car' },
  vehicle_license: { name: '机动车行驶证', color: '#9C27B0', icon: 'FileText' },
  ebike_plate: { name: '电动车牌照', color: '#E91E63', icon: 'Bike' },
};

export const TICKET_CATEGORY_MAP: Record<TicketCategory, { name: string; department: string }> = {
  transportation: { name: '交通出行', department: '南宁市交通运输局' },
  medical: { name: '医疗卫生', department: '南宁市卫生健康委员会' },
  education: { name: '教育服务', department: '南宁市教育局' },
  government: { name: '政务服务', department: '南宁市行政审批局' },
  urban_management: { name: '城市管理', department: '南宁市城市管理局' },
};

export const TICKET_STATUS_MAP: Record<TicketStatus, { name: string; color: string }> = {
  pending: { name: '待处理', color: '#FF8833' },
  assigned: { name: '已分派', color: '#2196F3' },
  processing: { name: '处理中', color: '#9C27B0' },
  resolved: { name: '已解决', color: '#4CAF50' },
  closed: { name: '已结案', color: '#666666' },
};

export type DispatchRuleType = 'keyword' | 'category' | 'time' | 'priority';
export type DispatchRuleCondition = {
  type: DispatchRuleType;
  value: string;
  operator?: string;
};

export interface DispatchRule {
  id: string;
  name: string;
  type: DispatchRuleType;
  condition: DispatchRuleCondition;
  department: string;
  ccDepartments?: string[];
  priority: TicketPriority;
  isEnabled: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const DISPATCH_RULE_TYPE_MAP: Record<DispatchRuleType, { name: string; color: string }> = {
  keyword: { name: '关键词匹配', color: '#2196F3' },
  category: { name: '类别匹配', color: '#9C27B0' },
  time: { name: '时间规则', color: '#FF8833' },
  priority: { name: '紧急程度', color: '#F44336' },
};

export interface DepartmentStats {
  departmentId: string;
  departmentName: string;
  pending: number;
  processing: number;
  resolved: number;
  overdue: number;
  total: number;
  avgProcessTime: number;
  resolutionRate: number;
  satisfactionRate: number;
}

export interface DepartmentReceipt {
  id: string;
  ticketNo: string;
  ticketTitle: string;
  department: string;
  receiver: string;
  receivedAt: string;
  estimatedFinishAt: string;
  status: TicketStatus;
  note?: string;
}

export const TICKET_ACTION_MAP: Record<string, { name: string; color: string; icon: string }> = {
  submit: { name: '提交', color: '#666666', icon: 'Send' },
  classify: { name: 'AI分类', color: '#2196F3', icon: 'Brain' },
  assign: { name: '分派', color: '#FF8833', icon: 'Share2' },
  receive: { name: '部门接收', color: '#9C27B0', icon: 'Inbox' },
  process: { name: '处理中', color: '#F59E0B', icon: 'Wrench' },
  resolve: { name: '反馈', color: '#4CAF50', icon: 'CheckCircle' },
  rate: { name: '评价', color: '#8B5CF6', icon: 'Star' },
};
