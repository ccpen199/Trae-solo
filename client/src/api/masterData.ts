import request from './http';
import { ProcessRoute, Material, Equipment, PaginatedResponse } from '@/types';

export const masterDataApi = {
  getProcessRoutes(params?: { isActive?: boolean; search?: string }) {
    return request.get<ProcessRoute[]>('/master-data/process-routes', { params });
  },

  getProcessRoute(id: string) {
    return request.get<ProcessRoute>(`/master-data/process-routes/${id}`);
  },

  getMaterials(params?: { type?: string; search?: string }) {
    return request.get<Material[]>('/master-data/materials', { params });
  },

  getMaterial(id: string) {
    return request.get<Material>(`/master-data/materials/${id}`);
  },

  getEquipment(params?: { status?: string; type?: string; search?: string }) {
    return request.get<Equipment[]>('/master-data/equipment', { params });
  },

  getEquipmentById(id: string) {
    return request.get<Equipment>(`/master-data/equipment/${id}`);
  },

  getBoms(params?: { isActive?: boolean; search?: string }) {
    return request.get('/master-data/boms', { params });
  },

  getBom(id: string) {
    return request.get(`/master-data/boms/${id}`);
  },

  getOperationLogs(params?: {
    tableName?: string;
    recordId?: string;
    userId?: string;
    operation?: string;
    page?: number;
    pageSize?: number;
  }) {
    return request.get('/master-data/operation-logs', { params });
  },

  getProductionHistory(params?: {
    workOrderId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) {
    return request.get('/master-data/production-history', { params });
  },
};

export default masterDataApi;
