export type UserRole = 'platform_engineer' | 'ops' | 'developer' | 'app_owner' | 'security_admin';
export type UserStatus = 'active' | 'disabled';
export type AppStatus = 'active' | 'disabled' | 'archived';
export type EnvType = 'dev' | 'test' | 'staging' | 'prod';
export type EnvStatus = 'active' | 'disabled';
export type SecretStatus = 'active' | 'expired' | 'disabled';
export type TaskStatus = 'pending' | 'running' | 'success' | 'failed';
export type VulnSeverity = 'critical' | 'high' | 'medium' | 'low';
export type VulnStatus = 'open' | 'fixed' | 'ignored';
export type AlertType = 'duplicate_execution' | 'permission_violation' | 'config_misuse' | 'task_failure' | 'data_leak';
export type AlertStatus = 'open' | 'processing' | 'closed';
export type ChangeType = 'config' | 'permission' | 'secret' | 'application';
export type ChangeStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'rolled_back';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface Application {
  id: number;
  name: string;
  code: string;
  description: string;
  ownerId: number;
  status: AppStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationWithOwner extends Application {
  ownerName: string;
}

export interface Environment {
  id: number;
  appId: number;
  name: string;
  type: EnvType;
  config: string;
  status: EnvStatus;
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
  versionId: number;
  envId: number;
  status: TaskStatus;
  severityCounts: string;
  startTime: string;
  endTime: string;
  triggeredBy: number;
  createdAt: string;
}

export interface ScanTaskWithDetails extends ScanTask {
  appName: string;
  version: string;
  envName: string;
  triggeredByName: string;
}

export interface Vulnerability {
  id: number;
  taskId: number;
  cveId: string;
  packageName: string;
  currentVersion: string;
  fixedVersion: string;
  severity: VulnSeverity;
  description: string;
  status: VulnStatus;
  createdAt: string;
}

export interface Alert {
  id: number;
  type: AlertType;
  severity: VulnSeverity;
  status: AlertStatus;
  assigneeId: number;
  title: string;
  content: string;
  suggestedAction: string;
  closeCriteria: string;
  createdAt: string;
  closedAt: string;
}

export interface AlertWithDetails extends Alert {
  assigneeName: string;
}

export interface ChangeOrder {
  id: number;
  type: ChangeType;
  status: ChangeStatus;
  operatorId: number;
  reason: string;
  affectedObjects: string;
  recoveryPath: string;
  oldValue: string;
  newValue: string;
  createdAt: string;
  executedAt: string;
}

export interface ChangeOrderWithDetails extends ChangeOrder {
  operatorName: string;
}

export interface ApiLog {
  id: number;
  method: string;
  path: string;
  userId: number;
  statusCode: number;
  duration: number;
  ip: string;
  userAgent: string;
  requestBody: string;
  createdAt: string;
}

export interface ApiLogWithUser extends ApiLog {
  username: string;
}

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  resourceType: string;
  resourceId: number;
  oldValue: string;
  newValue: string;
  createdAt: string;
}

export interface AuditLogWithUser extends AuditLog {
  username: string;
}

export interface Session {
  id: number;
  token: string;
  userId: number;
  expiresAt: string;
  createdAt: string;
}

export interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface DashboardStats {
  totalApplications: number;
  totalTasks: number;
  totalAlerts: number;
  totalVulnerabilities: number;
  tasksByStatus: Record<TaskStatus, number>;
  alertsBySeverity: Record<VulnSeverity, number>;
  vulnerabilitiesBySeverity: Record<VulnSeverity, number>;
  recentTasks: ScanTaskWithDetails[];
  recentAlerts: AlertWithDetails[];
}

export interface TimelineEvent {
  id: number;
  type: 'task' | 'change' | 'alert' | 'version';
  title: string;
  description: string;
  status: string;
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

export interface AuthRequest extends Request {
  user?: User;
  session?: Session;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
