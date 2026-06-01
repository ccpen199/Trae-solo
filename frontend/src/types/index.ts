export type UserRole = 'platform_engineer' | 'ops' | 'developer' | 'app_owner' | 'security_admin';
export type Status = 'active' | 'disabled' | 'archived';
export type EnvType = 'dev' | 'test' | 'staging' | 'prod';
export type TaskStatus = 'pending' | 'running' | 'success' | 'failed';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type VulnStatus = 'open' | 'fixed' | 'ignored';
export type AlertType = 'duplicate_execution' | 'permission_violation' | 'config_misuse' | 'task_failure' | 'data_leak';
export type AlertStatus = 'open' | 'processing' | 'closed';
export type ChangeType = 'config' | 'permission' | 'secret' | 'application';
export type ChangeStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'rolled_back';
export type SecretStatus = 'active' | 'expired' | 'disabled';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  status: 'active' | 'disabled';
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Application {
  id: number;
  name: string;
  code: string;
  description: string;
  ownerId: number;
  owner?: User;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface Environment {
  id: number;
  appId: number;
  name: string;
  type: EnvType;
  config: string;
  status: 'active' | 'disabled';
  createdAt: string;
}

export interface AppVersion {
  id: number;
  appId: number;
  version: string;
  branch: string;
  commitHash: string;
  dependencies: string;
  createdAt: string;
}

export interface SecretKey {
  id: number;
  appId: number;
  name: string;
  type: string;
  encryptedValue: string;
  expiresAt: string;
  status: SecretStatus;
  createdAt: string;
}

export interface ScanTask {
  id: number;
  appId: number;
  app?: Application;
  versionId: number;
  version?: AppVersion;
  envId: number;
  environment?: Environment;
  status: TaskStatus;
  severityCounts: string;
  startTime: string;
  endTime: string;
  triggeredBy: number;
  triggerUser?: User;
  createdAt: string;
}

export interface Vulnerability {
  id: number;
  taskId: number;
  cveId: string;
  packageName: string;
  currentVersion: string;
  fixedVersion: string;
  severity: Severity;
  description: string;
  status: VulnStatus;
  createdAt: string;
}

export interface Alert {
  id: number;
  type: AlertType;
  severity: Severity;
  status: AlertStatus;
  assigneeId: number;
  assignee?: User;
  title: string;
  content: string;
  suggestedAction: string;
  closeCriteria: string;
  createdAt: string;
  closedAt: string;
}

export interface ChangeOrder {
  id: number;
  type: ChangeType;
  status: ChangeStatus;
  operatorId: number;
  operator?: User;
  reason: string;
  affectedObjects: string;
  recoveryPath: string;
  oldValue: string;
  newValue: string;
  createdAt: string;
  executedAt: string;
}

export interface ApiLog {
  id: number;
  method: string;
  path: string;
  userId: number;
  user?: User;
  statusCode: number;
  duration: number;
  ip: string;
  userAgent: string;
  requestBody: string;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId: number;
  user?: User;
  action: string;
  resourceType: string;
  resourceId: number;
  oldValue: string;
  newValue: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: number;
  type: string;
  action: string;
  userId: number;
  user?: User;
  description: string;
  createdAt: string;
}

export interface DashboardStats {
  totalApplications: number;
  totalTasks: number;
  totalAlerts: number;
  totalVulnerabilities: number;
  openAlerts: number;
  criticalVulns: number;
  highVulns: number;
  mediumVulns: number;
  lowVulns: number;
  recentTasks: ScanTask[];
  recentAlerts: Alert[];
  vulnTrend: { date: string; count: number; severity: string }[];
}

export interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
