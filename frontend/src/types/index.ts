export enum UserRole {
  ADMIN = "admin",
  TEST_LEAD = "test_lead",
  TESTER = "tester",
  DEVELOPER = "developer",
  VIEWER = "viewer",
}

export enum BugStatus {
  NEW = "new",
  ASSIGNED = "assigned",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  VERIFIED = "verified",
  REOPENED = "reopened",
  CLOSED = "closed",
  REJECTED = "rejected",
}

export enum BugSeverity {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  TRIVIAL = "trivial",
}

export enum BugPriority {
  P1 = "p1",
  P2 = "p2",
  P3 = "p3",
  P4 = "p4",
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Module {
  id: string;
  name: string;
  code?: string;
  description?: string;
  sortOrder: number;
  parentId?: string;
  projectId: string;
  children?: Module[];
}

export interface Bug {
  id: string;
  bugNumber: string;
  title: string;
  description: string;
  status: BugStatus;
  severity: BugSeverity;
  priority: BugPriority;
  isPublished: boolean;
  projectId: string;
  moduleId?: string;
  requirementId?: string;
  versionId?: string;
  reporterId?: string;
  assigneeId?: string;
  stepsToReproduce?: string;
  expectedResult?: string;
  actualResult?: string;
  environment?: string;
  attachments?: string;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
  module?: Module;
  reporter?: User;
  assignee?: User;
}

export interface BugHistory {
  id: string;
  bugId: string;
  previousStatus?: BugStatus;
  newStatus?: BugStatus;
  comment?: string;
  changedFields?: Record<string, { old: any; new: any }>;
  userId?: string;
  user?: User;
  createdAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: {
    code: string;
    details?: any;
  };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginResponse {
  user: User;
  token: string;
}
