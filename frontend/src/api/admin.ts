import api from './index';
import type { User, OpinionAlert, AuditLog, PaginatedResponse } from '@/types';

interface DashboardData {
  totalUsers: number;
  totalWorkers: number;
  totalEmployers: number;
  totalJobs: number;
  pendingReviewJobs: number;
  approvedJobs: number;
  totalApplications: number;
  totalSettlements: number;
  totalSettlementAmount: number;
  pendingReports: number;
  verifiedReports: number;
  pendingAlerts: number;
  totalBlacklist: number;
  mediumRiskJobs: number;
  highRiskJobs: number;
}

export function getDashboard(): Promise<DashboardData> {
  return api.get('/admin/dashboard').then(res => res.data.data);
}

interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export function getUsers(filters: UserFilters = {}): Promise<PaginatedResponse<User>> {
  return api.get('/admin/users', { params: filters }).then(res => res.data.data);
}

export function updateUser(id: number, data: { status?: string; credit_score?: number }): Promise<User> {
  return api.put(`/admin/users/${id}`, data).then(res => res.data.data);
}

interface AlertFilters {
  status?: string;
  page?: number;
  pageSize?: number;
}

export function getOpinionAlerts(filters: AlertFilters = {}): Promise<PaginatedResponse<OpinionAlert>> {
  return api.get('/admin/opinion-alerts', { params: filters }).then(res => res.data.data);
}

export function updateOpinionAlert(id: number, data: { status: 'reviewed' | 'dismissed' }): Promise<OpinionAlert> {
  return api.put(`/admin/opinion-alerts/${id}`, data).then(res => res.data.data);
}

interface AuditLogFilters {
  action?: string;
  user_id?: number;
  page?: number;
  pageSize?: number;
}

export function getAuditLogs(filters: AuditLogFilters = {}): Promise<PaginatedResponse<AuditLog>> {
  return api.get('/admin/audit-logs', { params: filters }).then(res => res.data.data);
}
