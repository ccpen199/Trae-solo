import request from './http';
import { QualityInspection, PaginatedResponse, QualityResult } from '@/types';

export interface CreateInspectionData {
  workOrderId: string;
  workOrderProcessId?: string;
  inspectionType: string;
  sampleQty?: number;
  passQty: number;
  failQty: number;
  notes?: string;
}

export interface UpdateInspectionResultData {
  result: QualityResult;
  notes?: string;
}

export const qualityApi = {
  getList(params?: {
    workOrderId?: string;
    processId?: string;
    result?: string;
    inspectorId?: string;
    page?: number;
    pageSize?: number;
  }) {
    return request.get<PaginatedResponse<QualityInspection>>('/quality', { params });
  },

  getById(id: string) {
    return request.get<QualityInspection>(`/quality/${id}`);
  },

  create(data: CreateInspectionData) {
    return request.post<QualityInspection>('/quality', data);
  },

  updateResult(id: string, data: UpdateInspectionResultData) {
    return request.put<QualityInspection>(`/quality/${id}/result`, data);
  },
};

export default qualityApi;
