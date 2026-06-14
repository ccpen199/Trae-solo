import { get, post } from '../request';
import type { ApiResponse } from '../request';

export type VerificationStatus = 'success' | 'failed' | 'pending';
export type VerificationType = 'id_card' | 'face' | 'ticket' | 'terminal' | 'manual';
export type VerifyMethod = 'terminal' | 'manual';
export type CompareSource = 'police' | 'local';

export interface VerificationRecord {
  id: string;
  placeId: string;
  placeName: string;
  type: VerificationType;
  typeName: string;
  name: string;
  idCard: string;
  phone: string;
  status: VerificationStatus;
  statusName: string;
  verifyTime: string;
  operator: string;
  remark?: string;
  verifyMethod?: VerifyMethod;
  verifyMethodName?: string;
  compareSource?: CompareSource;
  compareSourceName?: string;
  confidence?: number;
  interceptResult?: string;
  isMinor?: boolean;
}

export interface VerificationListParams {
  page: number;
  pageSize: number;
  placeId?: string;
  type?: VerificationType;
  status?: VerificationStatus;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

export interface VerificationListData {
  list: VerificationRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RealNameVerifyParams {
  placeId: string;
  type: VerificationType;
  name: string;
  idCard: string;
  phone?: string;
  ticketNo?: string;
  faceImage?: string;
}

export interface RealNameVerifyResult {
  success: boolean;
  message: string;
  recordId: string;
  verifyTime: string;
  matchResult?: 'matched' | 'unmatched';
  confidence?: number;
  compareSource?: CompareSource;
  comparePhoto?: string;
  isMinor?: boolean;
  interceptRecordId?: string;
}

export interface LiveVerifyParams {
  placeId: string;
  name: string;
  idCard: string;
  phone?: string;
  cardReader?: boolean;
}

export interface LiveVerifyResult {
  step: number;
  matchResult: 'matched' | 'unmatched';
  confidence: number;
  compareSource: CompareSource;
  comparePhoto: string;
  verifyTime: string;
  isMinor: boolean;
  interceptRecordId?: string;
  recordId: string;
}

export interface MinorInterceptRecord {
  id: string;
  verificationId: string;
  placeId: string;
  placeName: string;
  minorName: string;
  minorIdCard: string;
  minorAge: number;
  discoverTime: string;
  discoverer: string;
  status: 'discovered' | 'notified' | 'picked_up' | 'police_involved' | 'closed';
  statusName: string;
  guardianName?: string;
  guardianPhone?: string;
  notifyTime?: string;
  pickUpTime?: string;
  handleResult?: 'guardian_pickup' | 'police_involved' | 'other';
  handleResultName?: string;
  handleRemark?: string;
  handlePhotos?: string[];
  closeTime?: string;
  closedBy?: string;
}

export interface MinorInterceptHandleParams {
  id: string;
  handleResult: 'guardian_pickup' | 'police_involved' | 'other';
  handleRemark: string;
  handlePhotos?: string[];
  guardianName?: string;
  guardianPhone?: string;
}

export interface VerificationStatistics {
  total: number;
  success: number;
  failed: number;
  pending: number;
  passRate: number;
  minorInterceptCount: number;
  todayTotal: number;
  todayPassRate: number;
  todayMinorIntercept: number;
}

export const getVerificationList = (
  params: VerificationListParams
): Promise<ApiResponse<VerificationListData>> => {
  return get<VerificationListData>('/verification/list', params);
};

export const getVerificationDetail = (id: string): Promise<ApiResponse<VerificationRecord>> => {
  return get<VerificationRecord>(`/verification/${id}`);
};

export const realNameVerify = (
  params: RealNameVerifyParams
): Promise<ApiResponse<RealNameVerifyResult>> => {
  return post<RealNameVerifyResult>('/verification/verify', params);
};

export const liveVerify = (
  params: LiveVerifyParams
): Promise<ApiResponse<LiveVerifyResult>> => {
  return post<LiveVerifyResult>('/verification/live-verify', params);
};

export const getVerificationStatistics = (
  params?: { startDate?: string; endDate?: string }
): Promise<ApiResponse<VerificationStatistics>> => {
  return get<VerificationStatistics>('/verification/statistics', params);
};

export const exportVerificationRecords = (
  params: Omit<VerificationListParams, 'page' | 'pageSize'>
): Promise<ApiResponse<string>> => {
  return post<string>('/verification/export', params);
};

export const getMinorInterceptList = (
  params?: { page?: number; pageSize?: number; status?: string }
): Promise<ApiResponse<{ list: MinorInterceptRecord[]; total: number }>> => {
  return get<{ list: MinorInterceptRecord[]; total: number }>('/verification/minor-intercept/list', params);
};

export const handleMinorIntercept = (
  params: MinorInterceptHandleParams
): Promise<ApiResponse<MinorInterceptRecord>> => {
  return post<MinorInterceptRecord>('/verification/minor-intercept/handle', params);
};
