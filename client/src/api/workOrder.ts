import request from './http';
import { WorkOrder, WorkOrderProcess, ProcessRoute, PaginatedResponse } from '@/types';

export interface CreateWorkOrderData {
  productName: string;
  productSpec?: string;
  plannedQty: number;
  priority: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  processRouteId: string;
  remark?: string;
  materials: Array<{
    materialId: string;
    materialName: string;
    qty: number;
    unit?: string;
  }>;
  equipmentIds: string[];
}

export interface AssignProcessData {
  userId: string;
  equipmentId?: string;
  assignedQty: number;
}

export const workOrderApi = {
  getList(params?: {
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    return request.get<PaginatedResponse<WorkOrder>>('/work-orders', { params });
  },

  getById(id: string) {
    return request.get<{ workOrder: WorkOrder; routeStatus: any }>(`/work-orders/${id}`);
  },

  create(data: CreateWorkOrderData) {
    return request.post<WorkOrder>('/work-orders', data);
  },

  issue(id: string) {
    return request.post<WorkOrder>(`/work-orders/${id}/issue`);
  },

  assignProcess(processId: string, data: AssignProcessData) {
    return request.post<WorkOrderProcess>(`/work-orders/process/${processId}/assign`, data);
  },

  startProcess(processId: string) {
    return request.post<WorkOrderProcess>(`/work-orders/process/${processId}/start`);
  },
};

export default workOrderApi;
