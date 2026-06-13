import request from './index';
import type {
  DashboardSummary,
  PassRateTrendPoint,
  QueryTopItem,
  UncertifiedPerson,
  UncertifiedPersonFilter,
  ReminderTask,
  ReminderTaskDetail,
  CreateReminderTaskRequest,
  AuditLogItem,
  AuditLogQuery,
  PaginatedResponse,
} from '@shared/types/admin';

export const adminApi = {
  login(employeeId: string, password: string) {
    return request.post<any, { token: string; adminInfo: { id: string; nameMasked: string; role: string } }>(
      '/admin/login',
      { employeeId, password },
    );
  },

  checkAuth() {
    return request.get<any, { adminInfo: { id: string; nameMasked: string; role: string } }>('/admin/check');
  },

  getSummary() {
    return request.get<any, DashboardSummary>('/admin/dashboard/summary');
  },

  getPassRateTrend(days: number = 30) {
    return request.get<any, PassRateTrendPoint[]>('/admin/dashboard/pass-rate-trend', { params: { days } });
  },

  getQueryTop() {
    return request.get<any, QueryTopItem[]>('/admin/dashboard/query-top');
  },

  getUncertifiedPeople(filter: UncertifiedPersonFilter, page = 1, size = 20) {
    return request.post<any, PaginatedResponse<UncertifiedPerson>>(
      '/admin/reminder/people',
      filter,
      { params: { page, size } },
    );
  },

  createReminderTask(data: CreateReminderTaskRequest) {
    return request.post<any, ReminderTask>('/admin/reminder/tasks', data);
  },

  getReminderTasks(page = 1, size = 20) {
    return request.get<any, PaginatedResponse<ReminderTask>>('/admin/reminder/tasks', { params: { page, size } });
  },

  getReminderTaskDetail(id: string) {
    return request.get<any, ReminderTaskDetail>(`/admin/reminder/tasks/${id}`);
  },

  getAuditLogs(query: AuditLogQuery) {
    return request.get<any, PaginatedResponse<AuditLogItem>>('/admin/audit/logs', { params: query });
  },
};
