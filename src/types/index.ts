export interface User {
  id: string;
  name: string;
  role: "citizen" | "staff" | "admin";
  caToken?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  caToken?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AccessConfig {
  endpoint?: string;
  method?: string;
  webhookUrl?: string;
  gatewayRoute?: string;
  headers?: Record<string, string>;
}

export interface Material {
  id: string;
  name: string;
  description: string;
  ocrFields: string[];
  required: boolean;
  format?: string[];
  quantity?: number;
  sampleUrl?: string;
}

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
  department: string;
  estimatedDays: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: "government" | "convenience";
  subCategory: string;
  description: string;
  icon: string;
  applicantCount: number;
  accessType: "http" | "webhook" | "api-gateway";
  accessConfig: AccessConfig;
  status: "online" | "offline" | "pending" | "degraded";
  department: string;
  departmentName: string;
  departmentId: string;
  serviceCode?: string;
  processingTime?: number | string;
  satisfaction?: number;
  rating?: number;
  reviewCount?: number;
  legalBasis?: string;
  chargeStandard?: string;
  contactPhone?: string;
  location?: string;
  requiredMaterials: Material[];
  processSteps: ProcessStep[];
}

export interface GuideRequest {
  question: string;
}

export interface GuideResponse {
  recommendedServices: ServiceItem[];
  processPath: ProcessStep[];
  materialList: Material[];
  tips: string[];
}

export interface OcrResponse {
  recognizedFields: Record<string, string>;
  confidence: number;
}

export interface HealthEndpoint {
  name: string;
  path: string;
  method: string;
  avgResponseTime: number;
  avgResponse?: number;
  failureRate: number;
  fail?: number;
  totalCalls: number;
  calls?: number;
}

export interface HealthMetrics {
  id?: string;
  departmentId: string;
  departmentName: string;
  avgResponseTime: number;
  avgResponse?: number;
  p50?: number;
  p95?: number;
  p99?: number;
  failureRate: number;
  timeoutCount: number;
  totalRequests?: number;
  successRate?: number;
  qps?: number;
  status: "healthy" | "warning" | "critical" | "degraded" | "down";
  lastCheckTime: string;
  lastCheck?: string;
  endpoints?: HealthEndpoint[];
}

export interface HeatmapDataPoint {
  region: string;
  timeSlot: string;
  serviceCategory: string;
  category?: string;
  service?: string;
  count: number;
}

export interface RelayRecord {
  id: string;
  time: string;
  direction: "to-province" | "from-province";
  service: string;
  dept: string;
  batchNo: string;
  dataType: string;
  records: number;
  dataSize: string;
  duration: string;
  status: "success" | "partial" | "failed" | "syncing";
  remarks?: string;
}

export interface MaterialReduction {
  fieldName: string;
  appearancesInServices: string[];
  currentDuplication: number;
  mergeSuggestion: string;
  estimatedReductionRate: number;
}

export interface RelayStatus {
  lastSyncTime: string;
  syncDirection: "upstream" | "downstream" | "bidirectional";
  status: "connected" | "disconnected" | "error";
  pendingRecords: number;
}

export interface CaseRecord {
  id: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  status: "submitted" | "processing" | "approved" | "rejected" | "completed";
  formData: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  todayCases: number;
  onlineServices: number;
  satisfactionRate: number;
  avgProcessTime: number;
  todayCasesTrend: number;
  onlineServicesTrend: number;
  satisfactionTrend: number;
  avgProcessTimeTrend: number;
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
  type: "policy" | "notice" | "update";
}
