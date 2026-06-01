import api from './client';
import { QualificationApplication, ProcessNode } from '../types';

export { QualificationApplication, ProcessNode };

export const getApplications = async (status?: string): Promise<QualificationApplication[]> => {
  const params = status ? { status } : {};
  const response = await api.get('/applications', { params });
  return response.data;
};

export const getApplication = async (id: number): Promise<QualificationApplication> => {
  const response = await api.get(`/applications/${id}`);
  return response.data;
};

export const createApplication = async (data: { customerId: number; productId: number }): Promise<QualificationApplication> => {
  const response = await api.post('/applications', data);
  return response.data;
};

export const updateApplicationStatus = async (id: number, status: string): Promise<QualificationApplication> => {
  const response = await api.patch(`/applications/${id}/status`, { status });
  return response.data;
};

export const processNode = async (nodeId: number, data: { status: string; remark?: string; rejectReason?: string }): Promise<ProcessNode> => {
  const response = await api.patch(`/process-nodes/${nodeId}`, data);
  return response.data;
};
