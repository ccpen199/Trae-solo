import api from './index';
import type { RiskReport, BlacklistEntry, RiskMapPoint, PaginatedResponse } from '@/types';

interface ReportFilters {
  status?: string;
  page?: number;
  pageSize?: number;
}

export function submitReport(data: { target_employer_id?: number; job_id?: number; report_type: string; description?: string; location?: string; lat?: number; lng?: number }): Promise<RiskReport> {
  return api.post('/risk/reports', data).then(res => res.data.data);
}

export function getReports(filters: ReportFilters = {}): Promise<PaginatedResponse<RiskReport>> {
  return api.get('/risk/reports', { params: filters }).then(res => res.data.data);
}

export function updateReport(id: number, data: { status: 'verified' | 'dismissed' }): Promise<RiskReport> {
  return api.put(`/risk/reports/${id}`, data).then(res => res.data.data);
}

export function getRiskMap(): Promise<RiskMapPoint[]> {
  return api.get('/risk/map').then(res => res.data.data);
}

export function getBlacklist(): Promise<BlacklistEntry[]> {
  return api.get('/risk/blacklist').then(res => res.data.data);
}
