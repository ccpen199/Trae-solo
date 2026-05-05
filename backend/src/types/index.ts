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
  password: string;
  name: string;
  email: string;
  phone: string;
  departmentId: number;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: number;
  name: string;
  description: string;
  managerId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyLog {
  id: number;
  userId: number;
  date: Date;
  content: string;
  planTomorrow: string;
  issues: string;
  isPlanCompleted: boolean;
  relatedFees: number;
  status: 'draft' | 'submitted' | 'reviewed';
  user?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  customerId: number;
  managerId: number;
  status: 'planning' | 'ongoing' | 'completed' | 'cancelled';
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectFeedback {
  id: number;
  projectId: number;
  userId: number;
  dailyLogId: number;
  content: string;
  isReported: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Evaluation {
  id: number;
  dailyLogId: number;
  evaluatorId: number;
  score: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reminder {
  id: number;
  userId: number;
  dailyLogId: number;
  message: string;
  reminderDate: Date;
  isRepeated: boolean;
  repeatType: 'daily' | 'weekly' | 'monthly';
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: number;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: number;
  customerId: number;
  name: string;
  position: string;
  phone: string;
  email: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: number;
  projectId: number;
  name: string;
  description: string;
  assigneeId: number;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMessage {
  id: number;
  projectId: number;
  userId: number;
  content: string;
  messageType: 'discussion' | 'request';
  parentMessageId: number;
  createdAt: Date;
}

export interface MissingLogRecord {
  id: number;
  userId: number;
  date: Date;
  logType: 'daily' | 'project_feedback';
  isNotified: boolean;
  createdAt: Date;
}

export { User as IUser };
export { Department as IDepartment };
export { DailyLog as IDailyLog };
export { Project as IProject };
export { ProjectFeedback as IProjectFeedback };
export { Evaluation as IEvaluation };
export { Reminder as IReminder };
export { Customer as ICustomer };
export { Contact as IContact };
export { Task as ITask };
export { ProjectMessage as IProjectMessage };
export { MissingLogRecord as IMissingLogRecord };
