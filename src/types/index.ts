export type ServiceDomain =
  | "livelihood"
  | "government"
  | "medical"
  | "traffic"
  | "education"
  | "lifestyle";

export type AuthLevel = "L1" | "L2" | "L3";
export type UserType = "citizen" | "enterprise" | "admin";
export type CaseStatus =
  | "draft"
  | "submitted"
  | "accepted"
  | "processing"
  | "pending_material"
  | "approved"
  | "rejected"
  | "completed";
export type CertificateStatus = "valid" | "expiring" | "expired" | "revoked";
export type TimelineStatus = "pending" | "processing" | "completed" | "rejected";
export type MaterialFormat = "pdf" | "image" | "doc";

export interface User {
  id: string;
  realName: string;
  idCardMasked: string;
  phoneMasked: string;
  avatar?: string;
  authLevel: AuthLevel;
  userType: UserType;
  departmentId?: string;
  department?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  contactPhone: string;
  serviceCount: number;
}

export interface MaterialTemplate {
  id: string;
  name: string;
  required: boolean;
  format: MaterialFormat;
  description: string;
  sampleUrl?: string;
}

export interface ProcessStep {
  id: string;
  name: string;
  description: string;
  estimatedDays: number;
  department: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: ServiceDomain;
  categoryName: string;
  subCategory: string;
  department: string;
  departmentId: string;
  description: string;
  handlingTime: string;
  fee?: string;
  materials: MaterialTemplate[];
  processSteps: ProcessStep[];
  onlineAvailable: boolean;
  appointmentAvailable: boolean;
  status: "online" | "offline" | "maintenance";
  viewCount: number;
  applyCount: number;
  satisfactionRate: number;
}

export interface CaseTimelineNode {
  nodeId: string;
  nodeName: string;
  status: TimelineStatus;
  handler?: string;
  handlerDept?: string;
  handleTime?: string;
  remark?: string;
}

export interface UploadedMaterial {
  id: string;
  templateId: string;
  name: string;
  fileName: string;
  uploadTime: string;
  fileSize: number;
}

export interface CaseResult {
  type: "certificate" | "approval" | "rejection";
  title: string;
  downloadUrl?: string;
  certificateId?: string;
  remark?: string;
}

export interface ApplicationCase {
  id: string;
  caseNo: string;
  serviceId: string;
  serviceName: string;
  applicantId: string;
  applicantName: string;
  status: CaseStatus;
  currentNode: string;
  timeline: CaseTimelineNode[];
  materials: UploadedMaterial[];
  applyTime: string;
  estimatedFinishTime?: string;
  finishTime?: string;
  result?: CaseResult;
  formData?: Record<string, string>;
}

export interface CertUsageRecord {
  id: string;
  time: string;
  verifier: string;
  verifierDept: string;
  purpose: string;
}

export interface Certificate {
  id: string;
  type: string;
  typeCode: string;
  certNo: string;
  holderName: string;
  issueDate: string;
  expireDate: string;
  issueAuthority: string;
  status: CertificateStatus;
  fields: Record<string, string>;
  usageHistory: CertUsageRecord[];
  color: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  ip: string;
  userAgent: string;
  result: "success" | "failed";
  createdAt: string;
}

export interface ServiceMonitor {
  serviceId: string;
  serviceName: string;
  uptime: number;
  avgResponseTime: number;
  status: "normal" | "warning" | "error";
  lastCheck: string;
  errorCount: number;
}

export interface HeatmapData {
  area: string;
  areaCode: string;
  hour: number;
  count: number;
  serviceCategory: ServiceDomain;
}

export interface StatsOverview {
  todayCases: number;
  todayCasesChange: number;
  totalServices: number;
  activeServices: number;
  totalCertificates: number;
  todayCertUsage: number;
  avgProcessingTime: number;
  satisfactionRate: number;
  satisfactionRateChange: number;
  departmentRanking: {
    department: string;
    cases: number;
    avgTime: number;
    satisfaction: number;
  }[];
  weeklyTrend: {
    date: string;
    cases: number;
    completed: number;
  }[];
  serviceDomainStats: {
    domain: ServiceDomain;
    domainName: string;
    count: number;
    percentage: number;
  }[];
}

export interface PendingApproval {
  id: string;
  caseNo: string;
  serviceName: string;
  applicantName: string;
  submitTime: string;
  deadline: string;
  priority: "high" | "medium" | "low";
  currentDept: string;
  requiredDepts: string[];
}
