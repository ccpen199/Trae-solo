export type UserType = 'natural' | 'legal' | 'staff' | 'admin';

export interface User {
  id: number;
  userType: UserType;
  name: string;
  idCard: string;
  phone?: string;
  passwordHash: string;
  roles?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserInfo {
  id: number;
  userType: UserType;
  name: string;
  idCard: string;
  phone: string;
  roles: string[];
  avatar?: string;
}

export interface LoginRequest {
  idCard: string;
  password: string;
  userType: UserType;
}

export interface LoginResponse {
  token: string;
  user: UserInfo;
}

export interface License {
  id: number;
  userId: number;
  licenseType: string;
  licenseNumber: string;
  holderName: string;
  issueDate?: string;
  expiryDate?: string;
  issuer?: string;
  status: 'valid' | 'expired' | 'revoked';
  createdAt: string;
}

export interface LicenseUsageRecord {
  id: number;
  licenseId: number;
  usedAt: string;
  usedBy?: string;
  purpose?: string;
  location?: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'tel' | 'email' | 'number' | 'date' | 'select' | 'textarea';
  required: boolean;
  prefillFrom?: string;
  options?: Array<{ value: string; label: string }>;
}

export interface FormGroup {
  name: string;
  title: string;
  fields: string[];
}

export interface FormSchema {
  fields: FormField[];
  groups?: FormGroup[];
}

export interface MaterialItem {
  name: string;
  required: boolean;
  canUseLicense: boolean;
  licenseType?: string;
}

export interface ScenarioOption {
  label: string;
  value: string;
  materials: string[];
  formFields: string[];
}

export interface ScenarioNode {
  question: string;
  options: ScenarioOption[];
}

export interface ScenarioTree {
  root: ScenarioNode;
}

export interface ServiceItem {
  id: number;
  name: string;
  code: string;
  department: string;
  category: string;
  handlingTimeLimit: number;
  runningCount: number;
  handlingDepth: string;
  formSchema: FormSchema;
  materialList: MaterialItem[];
  scenarioTree: ScenarioTree;
  version: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationStatus {
  status: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'completed';
}

export interface Application {
  id: number;
  applicationNo: string;
  serviceId: number;
  serviceName?: string;
  applicantId: number;
  applicantName?: string;
  status: ApplicationStatus['status'];
  formData: Record<string, any>;
  scenarioPath: string[];
  materialHashList?: string[];
  currentFlowNodeId?: number;
  submittedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface ApplicationTimelineItem {
  nodeName: string;
  operator: string;
  action: string;
  comment?: string;
  timestamp: string;
}

export interface CreateApplicationRequest {
  serviceId: number;
  scenarioPath: string[];
  formData: Record<string, any>;
  materials: Array<{
    materialName: string;
    isFromLicense: boolean;
    licenseId?: number;
    fileHash?: string;
  }>;
  signature?: string;
}

export interface QrCodeResponse {
  token: string;
  qrDataUrl: string;
  expiresAt: number;
}

export interface MetricsOverview {
  totalApplications: number;
  completionRate: number;
  averageHandlingTime: number;
  satisfactionScore: number;
  npsScore: number;
  overWarningCount: number;
  bottleneckNodes: BottleneckNode[];
}

export interface BottleneckNode {
  nodeName: string;
  department: string;
  avgWaitTime: number;
  pendingCount: number;
  severity: 'low' | 'medium' | 'high';
}

export interface ApiResource {
  id: number;
  name: string;
  code: string;
  provider: string;
  endpoint: string;
  callCount: number;
  avgResponseTime: number;
  errorRate: number;
  lastCalledAt?: string;
}

export interface ApprovalNode {
  id: number;
  applicationId: number;
  flowId: number;
  nodeName: string;
  department: string;
  operatorId?: number;
  action?: string;
  comment?: string;
  handledAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId?: number;
  applicationId?: number;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
