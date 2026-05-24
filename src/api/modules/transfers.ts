import request from '../request';
import type { Transfer, TransferStatus, TransferDocument } from '../../types';

export const getTransfers = (params?: any): Promise<Transfer[]> => {
  return request.get('/transfers', { params });
};

export const getTransfer = (id: number): Promise<Transfer> => {
  return request.get(`/transfers/${id}`);
};

export const createTransfer = (data: { contractId: number; documents: TransferDocument[] }): Promise<Transfer> => {
  return request.post('/transfers', data);
};

export const submitTransferDocuments = (
  id: number,
  documents: TransferDocument[]
): Promise<Transfer> => {
  return request.patch(`/transfers/${id}/documents`, { documents });
};

export const reviewTransfer = (
  id: number,
  approved: boolean,
  comment?: string
): Promise<Transfer> => {
  return request.patch(`/transfers/${id}/review`, { approved, comment });
};

export const completeTransfer = (id: number): Promise<Transfer> => {
  return request.patch(`/transfers/${id}/complete`);
};

export const updateTransferStatus = (
  id: number,
  status: TransferStatus,
  reason?: string
): Promise<Transfer> => {
  return request.patch(`/transfers/${id}/status`, { status, reason });
};
