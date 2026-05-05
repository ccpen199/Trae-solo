export interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'USER';
  employeeId?: string;
  employee?: Employee;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  employeeNo: string;
  name: string;
  gender: string;
  birthDate?: string;
  idCard?: string;
  phone?: string;
  email?: string;
  address?: string;
  departmentId?: string;
  position?: string;
  entryDate?: string;
  status: EmployeeStatus;
  baseSalary: number;
  department?: Department;
  education: Education[];
  trainings: Training[];
  transfers: Transfer[];
  rewardsPunishments: RewardPunishment[];
  attendances: Attendance[];
  salaries: Salary[];
  createdAt: string;
  updatedAt: string;
}

export type EmployeeStatus = 'ACTIVE' | 'RESIGNED' | 'RETIRED' | 'DISMISSED' | 'ON_LEAVE' | 'PROBATION';

export const EmployeeStatusLabel: Record<EmployeeStatus, string> = {
  ACTIVE: '在职',
  RESIGNED: '辞职',
  RETIRED: '退休',
  DISMISSED: '开除',
  ON_LEAVE: '休假',
  PROBATION: '试用',
};

export interface Department {
  id: string;
  name: string;
  code: string;
  managerId?: string;
  parentId?: string;
  parent?: Department;
  children?: Department[];
  manager?: Employee;
  employees?: Employee[];
  _count?: {
    employees: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Education {
  id: string;
  employeeId: string;
  school: string;
  degree: string;
  major?: string;
  startDate?: string;
  endDate?: string;
  certificateNo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Training {
  id: string;
  employeeId: string;
  name: string;
  provider?: string;
  content?: string;
  startDate?: string;
  endDate?: string;
  duration?: number;
  result?: string;
  certificateNo?: string;
  employee?: Employee;
  createdAt: string;
  updatedAt: string;
}

export interface Transfer {
  id: string;
  employeeId: string;
  fromDepartmentId?: string;
  toDepartmentId?: string;
  fromPosition?: string;
  toPosition?: string;
  transferDate?: string;
  reason?: string;
  approvedBy?: string;
  status: TransferStatus;
  employee?: Employee;
  fromDepartment?: Department;
  toDepartment?: Department;
  createdAt: string;
  updatedAt: string;
}

export type TransferStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export const TransferStatusLabel: Record<TransferStatus, string> = {
  PENDING: '待审批',
  APPROVED: '已批准',
  REJECTED: '已拒绝',
};

export interface RewardPunishment {
  id: string;
  employeeId: string;
  type: RewardPunishmentType;
  category?: string;
  reason?: string;
  amount: number;
  date?: string;
  approvedBy?: string;
  remark?: string;
  employee?: Employee;
  createdAt: string;
  updatedAt: string;
}

export type RewardPunishmentType = 'REWARD' | 'PUNISHMENT';

export const RewardPunishmentTypeLabel: Record<RewardPunishmentType, string> = {
  REWARD: '奖励',
  PUNISHMENT: '处罚',
};

export interface Attendance {
  id: string;
  employeeId: string;
  year: number;
  month: number;
  totalDays: number;
  workDays: number;
  publicHolidays: number;
  shouldAttend: number;
  actualAttend: number;
  leaveDays: number;
  sickLeave: number;
  personalLeave: number;
  annualLeave: number;
  overtimeHoliday: number;
  overtimeNormal: number;
  lateTimes: number;
  earlyLeaveTimes: number;
  absentDays: number;
  status: string;
  employee?: Employee;
  createdAt: string;
  updatedAt: string;
}

export interface Salary {
  id: string;
  employeeId: string;
  year: number;
  month: number;
  baseSalary: number;
  performanceSalary: number;
  allowance: number;
  bonus: number;
  overtimePay: number;
  housingFund: number;
  pension: number;
  medicalInsurance: number;
  unemployment: number;
  tax: number;
  otherDeduction: number;
  attendanceDeduction: number;
  totalIncome: number;
  totalDeduction: number;
  netSalary: number;
  status: string;
  paidDate?: string;
  employee?: Employee;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
    employeeId?: string;
    employeeName?: string;
  };
}
