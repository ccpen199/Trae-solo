export type AuthLevel = "L1" | "L2" | "L3";

export type UserType = "citizen" | "enterprise" | "admin";

export type ServiceDomain = "livelihood" | "government" | "medical" | "traffic" | "education" | "lifestyle";

export type CertificateStatus = "valid" | "expiring" | "expired" | "revoked";

export type CaseStatus =
  | "draft"
  | "submitted"
  | "accepted"
  | "processing"
  | "pending_material"
  | "approved"
  | "rejected"
  | "completed";

export interface User {
  id: string;
  realName: string;
  name?: string;
  idCardMasked: string;
  phoneMasked: string;
  authLevel: AuthLevel;
  userType: UserType;
  departmentId?: string;
  department?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  contactPhone: string;
  serviceCount: number;
}

export interface ServiceMaterial {
  id: string;
  name: string;
  required: boolean;
  format: "image" | "pdf" | "doc";
  description?: string;
}

export interface ServiceProcessStep {
  id: string;
  name: string;
  description: string;
  estimatedDays: number;
  department: string;
}

export interface UploadedMaterial {
  id: string;
  templateId?: string;
  name: string;
  fileName?: string;
  uploadTime?: string;
  fileSize?: number;
}

export interface CaseTimelineNode {
  nodeId: string;
  nodeName: string;
  status: "pending" | "processing" | "completed" | "rejected";
  handler?: string;
  handlerDept?: string;
  handleTime?: string;
  remark?: string;
}

export interface CaseResult {
  type: "approval" | "certificate" | "rejection" | "notice";
  title: string;
  remark?: string;
  downloadUrl?: string;
  certificateId?: string;
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
  formData?: Record<string, any>;
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
  fee: string;
  materials: ServiceMaterial[];
  processSteps: ServiceProcessStep[];
  onlineAvailable: boolean;
  appointmentAvailable: boolean;
  status: "online" | "maintenance" | "offline";
  viewCount: number;
  applyCount: number;
  satisfactionRate: number;
  authLevel: AuthLevel;
  userType: UserType[];
  district: string[];
}

export interface CertCategory {
  code: string;
  name: string;
  group: string;
  count: number;
  description: string;
  requiredAuthLevel: AuthLevel;
  canDelegate: boolean;
}

export interface CertificatePermission {
  scope: "private" | "government" | "public";
  description: string;
  allowedDepts?: string[];
  requireConsent: boolean;
  expireHours?: number;
}

export interface CertUsageRecord {
  id: string;
  time: string;
  verifier: string;
  verifierDept: string;
  purpose: string;
  authMethod: "face" | "sms" | "sso" | "password";
  result: "success" | "denied";
  ip: string;
  scope: "verify" | "read" | "download";
}

export interface Certificate {
  id: string;
  type: string;
  typeCode: string;
  categoryCode: string;
  certNo: string;
  holderName: string;
  issueDate: string;
  expireDate: string;
  issueAuthority: string;
  issuerCode?: string;
  status: CertificateStatus;
  color: string;
  authLevel: AuthLevel;
  permission: CertificatePermission;
  verificationCount?: number;
  lastVerifiedAt?: string;
  delegateCount?: number;
  fields: Record<string, string>;
  usageHistory?: CertUsageRecord[];
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
  weeklyTrend: { date: string; cases: number; completed: number }[];
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
