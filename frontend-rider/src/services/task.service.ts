import { get, post } from './http';
import type {
  TaskPool,
  GrabTaskRequest,
  AcceptTaskRequest,
  DispatchResult,
} from '@shared/types';

export const taskService = {
  getAvailableTasks: (params?: {
    orderType?: string;
    maxDistance?: number;
    page?: number;
    pageSize?: number;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return get<{ items: TaskPool[]; total: number }>(`/tasks/available?${query}`);
  },

  getCurrentTask: () => {
    return get<TaskPool | null>('/tasks/current');
  },

  grabTask: (data: GrabTaskRequest) => {
    return post<DispatchResult>('/tasks/grab', data);
  },

  acceptTask: (data: AcceptTaskRequest) => {
    return post<DispatchResult>('/tasks/accept', data);
  },

  getTaskDetail: (taskId: string) => {
    return get<TaskPool>(`/tasks/${taskId}`);
  },
};
