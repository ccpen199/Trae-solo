import request from './http';
import { ProductionReport, PaginatedResponse } from '@/types';

export interface SubmitReportData {
  workOrderId: string;
  workOrderProcessId?: string;
  passQty: number;
  failQty: number;
  workTime?: number;
  notes?: string;
}

export const reportApi = {
  submit(data: SubmitReportData) {
    return request.post<{ reportId: string }>('/reports', data);
  },

  getList(params?: {
    workOrderId?: string;
    processId?: string;
    reporterId?: string;
    page?: number;
    pageSize?: number;
  }) {
    return request.get<PaginatedResponse<ProductionReport>>('/reports', { params });
  },

  getRealtimeStatus() {
    return request.get('/reports/realtime-status');
  },

  getProcessDashboard(processId: string) {
    return request.get(`/reports/process/${processId}/dashboard`);
  },

  getWorkOrderYield(workOrderId: string) {
    return request.get(`/reports/yield/work-order/${workOrderId}`);
  },

  getWorkOrdersYield(params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }) {
    return request.get('/reports/yield/work-orders', { params });
  },

  getDailyYield(days?: number) {
    return request.get('/reports/yield/daily', { params: { days } });
  },

  getOEE(workOrderId: string) {
    return request.get(`/reports/oee/${workOrderId}`);
  },
};

export default reportApi;
