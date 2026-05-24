import request from '../request';
import type { Exception, HandlingRecord } from '../../types';

export const getExceptions = (params?: any): Promise<Exception[]> => {
  return request.get('/exceptions', { params });
};

export const getException = (id: number): Promise<Exception> => {
  return request.get(`/exceptions/${id}`);
};

export const createException = (data: Partial<Exception>): Promise<Exception> => {
  return request.post('/exceptions', data);
};

export const assignException = (id: number, assigneeId: number): Promise<Exception> => {
  return request.post(`/exceptions/${id}/assign`, { assigneeId });
};

export const addHandlingRecord = (id: number, action: string, comment: string): Promise<HandlingRecord> => {
  return request.post(`/exceptions/${id}/handling-records`, { action, comment });
};

export const resolveException = (id: number, resolution: string): Promise<Exception> => {
  return request.post(`/exceptions/${id}/resolve`, { resolution });
};

export const closeException = (id: number): Promise<Exception> => {
  return request.post(`/exceptions/${id}/close`);
};
