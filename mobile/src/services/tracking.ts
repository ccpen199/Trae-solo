import { request } from '@/utils/request';
import type { TodoItem, Notice, ApplyRecord } from '@/types';
import { mockTodos, mockNotices, mockApplyRecords } from '@/data/mock';

export const getTodos = async (): Promise<TodoItem[]> => {
  console.log('[TrackingService] 获取待办列表');
  return mockTodos;
};

export const getNotices = async (): Promise<Notice[]> => {
  console.log('[TrackingService] 获取通知公告');
  return mockNotices;
};

export const getTrackList = async (): Promise<ApplyRecord[]> => {
  console.log('[TrackingService] 获取追踪列表');
  return mockApplyRecords;
};

export const getApplyDetail = async (id: string): Promise<ApplyRecord> => {
  console.log('[TrackingService] 获取审批详情:', id);
  return mockApplyRecords.find(r => r.id === id) || mockApplyRecords[0];
};

export const getStatistics = async (): Promise<{
  total: number;
  reviewing: number;
  approved: number;
  rejected: number;
  pendingSign: number;
}> => {
  console.log('[TrackingService] 获取统计数据');
  return {
    total: mockApplyRecords.length + 8,
    reviewing: mockApplyRecords.filter(r => r.status === 'reviewing').length + 2,
    approved: mockApplyRecords.filter(r => r.status === 'approved').length + 5,
    rejected: mockApplyRecords.filter(r => r.status === 'rejected').length + 1,
    pendingSign: 2
  };
};
