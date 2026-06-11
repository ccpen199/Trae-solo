import request from './request';

export interface SubsidyItem {
  id: string;
  name: string;
  amount: number;
  status: 'available' | 'used' | 'expired';
  source: string;
  validFrom: string;
  validTo: string;
  qrCode?: string;
}

export interface VerifyResult {
  success: boolean;
  subsidyName: string;
  amount: number;
  merchantName: string;
  verifiedAt: string;
}

export function getMySubsidies() {
  return request.get<unknown, SubsidyItem[]>('/subsidy/my');
}

export function getSubsidyDetail(id: string) {
  return request.get<unknown, SubsidyItem>(`/subsidy/${id}`);
}

export function verifySubsidy(code: string) {
  return request.post<unknown, VerifyResult>('/subsidy/verify', { code });
}

export function getSubsidyRecords(params?: { page?: number; size?: number }) {
  return request.get('/subsidy/records', { params });
}

export function getAvailableSubsidies() {
  return request.get<unknown, SubsidyItem[]>('/subsidy/available');
}
