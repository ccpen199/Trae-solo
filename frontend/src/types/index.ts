export enum Role {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  EMPLOYEE = 'EMPLOYEE',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CONFIRMED = 'CONFIRMED',
  ARCHIVED = 'ARCHIVED',
}

export enum PlanStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: TaskStatus;
  creatorId: string;
  assigneeId: string;
  creator?: { id: string; name: string; username: string };
  assignee?: { id: string; name: string; username: string };
  plans?: Plan[];
  feedbacks?: Feedback[];
  _count?: { plans: number; feedbacks: number };
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  taskId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: PlanStatus;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Feedback {
  id: string;
  taskId: string;
  content: string;
  creatorId: string;
  creator?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  assigneeId?: string;
}

export interface PaginationData<T> {
  tasks: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
