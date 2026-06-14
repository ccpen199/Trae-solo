import { get, post, put } from '../request';
import type { ApiResponse } from '../request';

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'used' | 'expired';

export interface Reservation {
  id: string;
  orderNo: string;
  placeId: string;
  placeName: string;
  visitorName: string;
  visitorPhone: string;
  visitorIdCard: string;
  visitorCount: number;
  visitDate: string;
  visitTimeSlot: string;
  status: ReservationStatus;
  statusName: string;
  createdAt: string;
  confirmedAt?: string;
  usedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  remark?: string;
  verifyStatus?: 'unverified' | 'verified' | 'timeout' | 'mismatch';
  verifyStatusName?: string;
  verifyTime?: string;
  isAbnormal?: boolean;
  abnormalReason?: string;
}

export interface ReservationListParams {
  page: number;
  pageSize: number;
  placeId?: string;
  status?: ReservationStatus;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

export interface ReservationListData {
  list: Reservation[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReservationConfig {
  id: string;
  placeId: string;
  placeName: string;
  maxDailyCapacity: number;
  maxPerReservation: number;
  minAdvanceDays: number;
  maxAdvanceDays: number;
  timeSlots: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  overCapacityPolicy?: 'auto_reject' | 'queue_wait';
  overCapacityPolicyName?: string;
  lateCancelMinutes?: number;
  noShowHandling?: 'auto_cancel' | 'mark_no_show';
  maxDailyReservationsPerPhone?: number;
  abnormalRules?: {
    maxDailyReservationsPerPhone: number;
    lateCancelMinutes: number;
    noShowHandling: 'auto_cancel' | 'mark_no_show';
  };
}

export interface ReservationCreateParams {
  placeId: string;
  visitorName: string;
  visitorPhone: string;
  visitorIdCard: string;
  visitorCount: number;
  visitDate: string;
  visitTimeSlot: string;
  remark?: string;
}

export interface ReservationVerifyParams {
  orderNo: string;
  operator: string;
}

export interface ReservationVerifyResult {
  success: boolean;
  message: string;
  reservation: Reservation;
}

export interface CapacitySlot {
  timeSlot: string;
  totalCapacity: number;
  reserved: number;
  checkedIn: number;
  remaining: number;
  status: 'normal' | 'tight' | 'full';
  statusName: string;
}

export interface CapacityBoardData {
  placeId: string;
  placeName: string;
  date: string;
  totalCapacity: number;
  totalReserved: number;
  totalCheckedIn: number;
  totalRemaining: number;
  slots: CapacitySlot[];
}

export const getReservationList = (
  params: ReservationListParams
): Promise<ApiResponse<ReservationListData>> => {
  return get<ReservationListData>('/reservation/list', params);
};

export const getReservationDetail = (id: string): Promise<ApiResponse<Reservation>> => {
  return get<Reservation>(`/reservation/${id}`);
};

export const createReservation = (
  params: ReservationCreateParams
): Promise<ApiResponse<Reservation>> => {
  return post<Reservation>('/reservation', params);
};

export const cancelReservation = (id: string, reason: string): Promise<ApiResponse<Reservation>> => {
  return put<Reservation>(`/reservation/${id}/cancel`, { reason });
};

export const verifyReservation = (
  params: ReservationVerifyParams
): Promise<ApiResponse<ReservationVerifyResult>> => {
  return post<ReservationVerifyResult>('/reservation/verify', params);
};

export const getReservationConfig = (placeId: string): Promise<ApiResponse<ReservationConfig>> => {
  return get<ReservationConfig>(`/reservation/config/${placeId}`);
};

export const updateReservationConfig = (
  placeId: string,
  params: Partial<Omit<ReservationConfig, 'id' | 'placeId' | 'placeName' | 'createdAt' | 'updatedAt'>>
): Promise<ApiResponse<ReservationConfig>> => {
  return put<ReservationConfig>(`/reservation/config/${placeId}`, params);
};

export const getReservationStatistics = (
  params?: { startDate?: string; endDate?: string; placeId?: string }
): Promise<ApiResponse<Record<string, number>>> => {
  return get<Record<string, number>>('/reservation/statistics', params);
};

export const getCapacityBoard = (
  params?: { placeId?: string; date?: string }
): Promise<ApiResponse<CapacityBoardData[]>> => {
  return get<CapacityBoardData[]>('/reservation/capacity-board', params);
};
