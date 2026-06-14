import { get, post, put } from '../request';
import type { ApiResponse } from '../request';

export type AlarmLevel = 'low' | 'medium' | 'high' | 'critical';
export type AlarmStatus = 'pending' | 'confirmed' | 'dispatched' | 'received' | 'processing' | 'resolved' | 'reviewing' | 'closed' | 'ignored';
export type AlarmType = 'overcrowd' | 'fire' | 'intrusion' | 'equipment' | 'system' | 'other';

export interface Alarm {
  id: string;
  alarmNo: string;
  placeId: string;
  placeName: string;
  type: AlarmType;
  typeName: string;
  level: AlarmLevel;
  levelName: string;
  title: string;
  description: string;
  location: string;
  images: string[];
  status: AlarmStatus;
  statusName: string;
  createdAt: string;
  startedAt: string;
  confidence?: number;
  handledAt?: string;
  handler?: string;
  handleMethod?: string;
  handleResult?: string;
  handleDuration?: number;
  lifecycle?: AlarmLifecycleNode[];
  dispatchOpinion?: string;
  dispatchTime?: string;
  receiveTime?: string;
  receiveRemark?: string;
  handlePhotos?: string[];
  reviewResult?: 'pass' | 'reject';
  reviewRemark?: string;
  reviewTime?: string;
  reviewer?: string;
  closeTime?: string;
  closedBy?: string;
  lawReference?: string;
}

export interface AlarmLifecycleNode {
  step: number;
  stepName: string;
  operator: string;
  operatorRole: string;
  operateTime: string;
  content: string;
  result: string;
  attachments?: string[];
  lawReference?: string;
}

export interface AlarmListParams {
  page: number;
  pageSize: number;
  placeId?: string;
  type?: AlarmType;
  level?: AlarmLevel;
  status?: AlarmStatus;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

export interface AlarmListData {
  list: Alarm[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AlarmHandleParams {
  id: string;
  status: 'processing' | 'resolved' | 'ignored';
  handleMethod: string;
  handleResult: string;
  handler: string;
}

export interface AlarmConfirmParams {
  id: string;
  isConfirmed: boolean;
  handler: string;
  dispatchOpinion?: string;
}

export interface AlarmReceiveParams {
  id: string;
  receiveRemark: string;
}

export interface AlarmProcessParams {
  id: string;
  handleResult: string;
  handlePhotos?: string[];
  rectifyMeasures?: string;
}

export interface AlarmReviewParams {
  id: string;
  reviewResult: 'pass' | 'reject';
  reviewRemark: string;
}

export interface AlarmStatisticsData {
  total: number;
  pending: number;
  processing: number;
  resolved: number;
  levelStats: Record<AlarmLevel, number>;
  typeStats: Record<AlarmType, number>;
  trend: { date: string; count: number }[];
}

export const getAlarmList = (params: AlarmListParams): Promise<ApiResponse<AlarmListData>> => {
  return get<AlarmListData>('/alarm/list', params);
};

export const getAlarmDetail = (id: string): Promise<ApiResponse<Alarm>> => {
  return get<Alarm>(`/alarm/${id}`);
};

export const handleAlarm = (params: AlarmHandleParams): Promise<ApiResponse<Alarm>> => {
  return put<Alarm>('/alarm/handle', params);
};

export const confirmAlarm = (params: AlarmConfirmParams): Promise<ApiResponse<Alarm>> => {
  return post<Alarm>('/alarm/confirm', params);
};

export const receiveAlarm = (params: AlarmReceiveParams): Promise<ApiResponse<Alarm>> => {
  return post<Alarm>('/alarm/receive', params);
};

export const processAlarm = (params: AlarmProcessParams): Promise<ApiResponse<Alarm>> => {
  return post<Alarm>('/alarm/process', params);
};

export const reviewAlarm = (params: AlarmReviewParams): Promise<ApiResponse<Alarm>> => {
  return post<Alarm>('/alarm/review', params);
};

export const getAlarmStatistics = (
  params?: { startDate?: string; endDate?: string; placeId?: string }
): Promise<ApiResponse<AlarmStatisticsData>> => {
  return get<AlarmStatisticsData>('/alarm/statistics', params);
};

export const exportAlarms = (
  params: Omit<AlarmListParams, 'page' | 'pageSize'>
): Promise<ApiResponse<string>> => {
  return post<string>('/alarm/export', params);
};
