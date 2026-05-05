export enum UserRole {
  ADMIN = 'admin',
  GM = 'general_manager',
  DEPT_MANAGER = 'department_manager',
  SUPERVISOR = 'supervisor',
  EMPLOYEE = 'employee'
}

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  departmentId: number;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: number;
  name: string;
  description: string;
  managerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyLog {
  id: number;
  userId: number;
  date: string;
  content: string;
  planTomorrow: string;
  issues: string;
  isPlanCompleted: boolean;
  relatedFees: number;
  status: 'draft' | 'submitted' | 'reviewed';
  user?: User;
  evaluations?: Evaluation[];
  createdAt: string;
  updatedAt: string;
}

export interface Evaluation {
  id: number;
  dailyLogId: number;
  evaluatorId: number;
  score: number;
  comment: string;
  evaluator?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  customerId: number;
  managerId: number;
  status: 'planning' | 'ongoing' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFeedback {
  id: number;
  projectId: number;
  userId: number;
  dailyLogId: number;
  content: string;
  isReported: boolean;
  user?: User;
  project?: Project;
  dailyLog?: DailyLog;
  createdAt: string;
  updatedAt: string;
}

export interface MissingLogRecord {
  id: number;
  userId: number;
  date: string;
  logType: 'daily' | 'project_feedback';
  isNotified: boolean;
  user?: User;
  createdAt: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  data?: T;
  message: string;
  total?: number;
  page?: number;
  limit?: number;
}

export interface DailyLogListParams {
  startDate?: string;
  endDate?: string;
  status?: string;
  page?: number;
  limit?: number;
}
