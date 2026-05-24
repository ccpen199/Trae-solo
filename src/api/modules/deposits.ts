import request from '../request';
import type { Deposit, DepositStatus } from '../../types';

export const getDeposits = (params?: any): Promise<Deposit[]> => {
  return request.get('/deposits', { params });
};

export const getDeposit = (id: number): Promise<Deposit> => {
  return request.get(`/deposits/${id}`);
};

export const confirmPayment = (id: number, transactionId: string): Promise<Deposit> => {
  return request.patch(`/deposits/${id}/confirm-payment`, { transactionId });
};

export const requestRefund = (id: number, reason: string): Promise<Deposit> => {
  return request.post(`/deposits/${id}/refund-request`, { reason });
};

export const approveRefund = (id: number, approved: boolean, reason?: string): Promise<Deposit> => {
  return request.patch(`/deposits/${id}/refund-approval`, { approved, reason });
};

export const releaseDeposit = (id: number, releaseType: 'to_seller' | 'deducted'): Promise<Deposit> => {
  return request.patch(`/deposits/${id}/release`, { releaseType });
};
