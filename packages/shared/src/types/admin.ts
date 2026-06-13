// 管理后台统计模块类型定义
import type { InsuranceType } from './social-insurance';

export interface DashboardSummary {
  todayCertCount: number;
  todayCertPassRate: number;
  todayQueryCount: number;
  activeUsers7d: number;
  pendingReminderCount: number;
}

export interface PassRateTrendPoint {
  date: string;
  totalCount: number;
  successCount: number;
  failCount: number;
  lockedCount: number;
  passRate: number;
}

export type QueryTopTrend = 'UP' | 'DOWN' | 'FLAT';

export interface QueryTopItem {
  rank: number;
  itemName: string;
  queryCount: number;
  percentage: number;
  momChange: number;
  trend: QueryTopTrend;
}

export interface UncertifiedPersonFilter {
  region?: string[];
  ageRange?: [number, number];
  insuranceType?: InsuranceType[];
  overdueDays?: [number, number];
}

export interface UncertifiedPerson {
  id: string;
  nameMasked: string;
  idCardMasked: string;
  region: string;
  lastCertDate: string;
  overdueDays: number;
  phoneMasked: string;
  insuranceTypes: InsuranceType[];
}

export type TaskStatus = 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';

export const TaskStatusMap: Record<TaskStatus, string> = {
  DRAFT: '草稿',
  RUNNING: '执行中',
  COMPLETED: '已完成',
  CANCELLED: '已取消'
};

export interface ReminderTask {
  id: string;
  name: string;
  createdAt: string;
  creator: string;
  totalCount: number;
  deliveredCount: number;
  readCount: number;
  convertedCount: number;
  status: TaskStatus;
  progress: number;
}

export interface ReminderTaskDetail extends ReminderTask {
  filterCriteria: UncertifiedPersonFilter;
  persons: UncertifiedPerson[];
}

export interface CreateReminderTaskRequest {
  name: string;
  filter: UncertifiedPersonFilter;
  templateId: string;
  scheduledAt?: string;
}

export type AuditLogModule = 'AUTH' | 'SOCIAL' | 'CERTIFY' | 'TASK' | 'SYSTEM';
export type AuditLogResult = 'SUCCESS' | 'FAIL';

export const AuditModuleMap: Record<AuditLogModule, string> = {
  AUTH: '认证模块',
  SOCIAL: '社保查询',
  CERTIFY: '生存认证',
  TASK: '任务管理',
  SYSTEM: '系统管理'
};

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userId: string;
  userNameMasked: string;
  operation: string;
  module: AuditLogModule;
  ip: string;
  deviceInfo: string;
  result: AuditLogResult;
  detail: string;
}

export interface AuditLogQuery {
  userId?: string;
  module?: AuditLogModule;
  operation?: string;
  startDate?: string;
  endDate?: string;
  result?: AuditLogResult;
  page?: number;
  size?: number;
}
