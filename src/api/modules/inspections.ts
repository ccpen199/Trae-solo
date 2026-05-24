import request from '../request';
import type { Inspection } from '../../types';

export const getInspections = (params?: any): Promise<Inspection[]> => {
  return request.get('/inspections', { params });
};

export const getInspection = (id: number): Promise<Inspection> => {
  return request.get(`/inspections/${id}`);
};

export const createInspection = (data: Partial<Inspection>): Promise<Inspection> => {
  return request.post('/inspections', data);
};

export const updateInspection = (id: number, data: Partial<Inspection>): Promise<Inspection> => {
  return request.put(`/inspections/${id}`, data);
};

export const submitInspection = (id: number): Promise<Inspection> => {
  return request.post(`/inspections/${id}/submit`);
};

export const auditInspection = (id: number, approved: boolean, comment: string): Promise<Inspection> => {
  return request.post(`/inspections/${id}/audit`, { approved, comment });
};
