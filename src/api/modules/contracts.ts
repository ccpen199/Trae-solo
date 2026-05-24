import request from '../request';
import type { Contract, ContractStatus } from '../../types';

export const getContracts = (params?: any): Promise<Contract[]> => {
  return request.get('/contracts', { params });
};

export const getContract = (id: number): Promise<Contract> => {
  return request.get(`/contracts/${id}`);
};

export const createContract = (data: Partial<Contract>): Promise<Contract> => {
  return request.post('/contracts', data);
};

export const signContract = (id: number, signer: 'buyer' | 'dealer'): Promise<Contract> => {
  return request.patch(`/contracts/${id}/sign`, { signer });
};

export const confirmFinalPayment = (id: number, transactionId: string): Promise<Contract> => {
  return request.patch(`/contracts/${id}/confirm-final-payment`, { transactionId });
};

export const completeContract = (id: number): Promise<Contract> => {
  return request.patch(`/contracts/${id}/complete`);
};

export const updateContractStatus = (
  id: number,
  status: ContractStatus,
  reason?: string
): Promise<Contract> => {
  return request.patch(`/contracts/${id}/status`, { status, reason });
};
