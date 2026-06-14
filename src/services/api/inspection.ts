import { get, post, put } from '../request';
import type { ApiResponse } from '../request';

export type InspectionStatus = 'pending' | 'dispatched' | 'accepted' | 'in_progress' | 'submitted' | 'reviewing' | 'completed' | 'rejected' | 'cancelled';
export type InspectionPriority = 'low' | 'medium' | 'high';
export type InspectionType = 'routine' | 'special' | 'complaint' | 'emergency';

export interface InspectionItem {
  id: string;
  name: string;
  category: string;
  status: 'pass' | 'fail' | 'na';
  remark?: string;
  images?: string[];
}

export interface InspectionTask {
  id: string;
  taskNo: string;
  title: string;
  type: InspectionType;
  typeName: string;
  priority: InspectionPriority;
  priorityName: string;
  placeId: string;
  placeName: string;
  inspector: string;
  inspectorId: string;
  status: InspectionStatus;
  statusName: string;
  description: string;
  checkItems: InspectionItem[];
  createdAt: string;
  startTime: string;
  deadline: string;
  completedAt?: string;
  result?: string;
  score?: number;
  remark?: string;
  dispatchTime?: string;
  dispatchRemark?: string;
  acceptTime?: string;
  acceptRemark?: string;
  submitTime?: string;
  reviewTime?: string;
  reviewer?: string;
  reviewResult?: 'pass' | 'reject';
  reviewRemark?: string;
  rejectTime?: string;
  rejectRemark?: string;
  lifecycle?: InspectionLifecycleNode[];
}

export interface InspectionLifecycleNode {
  step: number;
  stepName: string;
  operator: string;
  operatorRole: string;
  operateTime: string;
  content: string;
  result: string;
  attachments?: string[];
}

export interface InspectionListParams {
  page: number;
  pageSize: number;
  placeId?: string;
  type?: InspectionType;
  priority?: InspectionPriority;
  status?: InspectionStatus;
  inspector?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

export interface InspectionListData {
  list: InspectionTask[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InspectionCreateParams {
  title: string;
  type: InspectionType;
  priority: InspectionPriority;
  placeId: string;
  inspectorId: string;
  description: string;
  checkItems: { name: string; category: string }[];
  startTime: string;
  deadline: string;
}

export interface InspectionExecuteParams {
  id: string;
  checkItems: InspectionItem[];
  result: string;
  score: number;
  remark?: string;
}

export interface InspectionAcceptParams {
  id: string;
  acceptRemark?: string;
}

export interface InspectionReviewParams {
  id: string;
  reviewResult: 'pass' | 'reject';
  reviewRemark: string;
}

export const getInspectionList = (
  params: InspectionListParams
): Promise<ApiResponse<InspectionListData>> => {
  return get<InspectionListData>('/inspection/list', params);
};

export const getInspectionDetail = (id: string): Promise<ApiResponse<InspectionTask>> => {
  return get<InspectionTask>(`/inspection/${id}`);
};

export const createInspection = (
  params: InspectionCreateParams
): Promise<ApiResponse<InspectionTask>> => {
  return post<InspectionTask>('/inspection', params);
};

export const executeInspection = (
  params: InspectionExecuteParams
): Promise<ApiResponse<InspectionTask>> => {
  return put<InspectionTask>('/inspection/execute', params);
};

export const cancelInspection = (id: string, reason: string): Promise<ApiResponse<InspectionTask>> => {
  return put<InspectionTask>(`/inspection/${id}/cancel`, { reason });
};

export const acceptInspection = (
  params: InspectionAcceptParams
): Promise<ApiResponse<InspectionTask>> => {
  return post<InspectionTask>('/inspection/accept', params);
};

export const reviewInspection = (
  params: InspectionReviewParams
): Promise<ApiResponse<InspectionTask>> => {
  return post<InspectionTask>('/inspection/review', params);
};

export const getInspectionStatistics = (
  params?: { startDate?: string; endDate?: string; placeId?: string }
): Promise<ApiResponse<Record<string, number>>> => {
  return get<Record<string, number>>('/inspection/statistics', params);
};
