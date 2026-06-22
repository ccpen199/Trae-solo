import { get, put } from './http';
import type { PaginationResult, Rider } from '@shared/types';

export interface RiderListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  isOnline?: boolean;
  isFrozen?: boolean;
  auditStatus?: string;
}

export interface RiderStatusRequest {
  riderId: string;
  isFrozen: boolean;
  frozenReason?: string;
  frozenDays?: number;
}

export interface CreditAdjustRequest {
  riderId: string;
  change: number;
  reason: string;
  orderId?: string;
}

export const riderService = {
  getList(params?: RiderListParams): Promise<PaginationResult<Rider>> {
    return get('/admin/riders', { params });
  },

  getDetail(id: string): Promise<Rider> {
    return get(`/admin/riders/${id}`);
  },

  updateStatus(data: RiderStatusRequest): Promise<null> {
    return put('/admin/riders/status', data);
  },

  adjustCredit(data: CreditAdjustRequest): Promise<{ newCreditScore: number }> {
    return put('/admin/riders/credit', data);
  },
};
