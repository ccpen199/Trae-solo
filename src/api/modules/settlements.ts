import request from '../request';
import type { Settlement, SettlementStatus, SettlementFee } from '../../types';

export const getSettlements = (params?: any): Promise<Settlement[]> => {
  return request.get('/settlements', { params });
};

export const getSettlement = (id: number): Promise<Settlement> => {
  return request.get(`/settlements/${id}`);
};

export const createSettlement = (data: {
  contractId: number;
  platformFee: number;
  otherFees: SettlementFee[];
}): Promise<Settlement> => {
  return request.post('/settlements', data);
};

export const markSettled = (id: number): Promise<Settlement> => {
  return request.patch(`/settlements/${id}/settled`);
};

export const markReconciled = (id: number): Promise<Settlement> => {
  return request.patch(`/settlements/${id}/reconciled`);
};

export const markInvoiced = (id: number, invoiceNumber: string): Promise<Settlement> => {
  return request.patch(`/settlements/${id}/invoiced`, { invoiceNumber });
};

export const updateSettlementStatus = (
  id: number,
  status: SettlementStatus,
  reason?: string
): Promise<Settlement> => {
  return request.patch(`/settlements/${id}/status`, { status, reason });
};
