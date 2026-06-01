import api from './index';
import type { Settlement, PaginatedResponse } from '@/types';

interface SettlementFilters {
  status?: string;
  page?: number;
  pageSize?: number;
}

export function createSettlement(data: { job_id: number; worker_id: number; amount: number; platform_fee?: number; worker_bank_info?: Record<string, string> }): Promise<Settlement> {
  return api.post('/settlements', data).then(res => res.data.data);
}

export function getSettlements(filters: SettlementFilters = {}): Promise<PaginatedResponse<Settlement>> {
  return api.get('/settlements', { params: filters }).then(res => res.data.data);
}

export function getSettlement(id: number): Promise<Settlement> {
  return api.get(`/settlements/${id}`).then(res => res.data.data);
}

export function confirmSettlement(id: number): Promise<Settlement> {
  return api.post(`/settlements/${id}/confirm`).then(res => res.data.data);
}

export function releaseSettlement(id: number): Promise<Settlement> {
  return api.post(`/settlements/${id}/release`).then(res => res.data.data);
}
