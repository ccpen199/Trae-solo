import { get, post, put, del } from './request';
import { 
  WorkCase, Task, EvidenceItem, EvidenceFolder,
  CreateCaseParams, CreateTaskParams, UpdateTaskStatusParams,
  PaginationResult, PaginationParams } from '@/types';

export const workspaceApi = {
  getCaseList: (params: PaginationParams & {
    keyword?: string; status?: string; priority?: string }): Promise<PaginationResult<WorkCase>> => {
    return get<PaginationResult<WorkCase>>('/workspace/cases', { params });
  },

  getCaseDetail: (id: string): Promise<WorkCase> => {
    return get<WorkCase>(`/workspace/cases/${id}`);
  },

  createCase: (data: CreateCaseParams): Promise<WorkCase> => {
    return post<WorkCase>('/workspace/cases', data);
  },

  updateCase: (id: string, data: Partial<WorkCase>): Promise<WorkCase> => {
    return put<WorkCase>(`/workspace/cases/${id}`, data);
  },

  archiveCase: (id: string): Promise<void> => {
    return post(`/workspace/cases/${id}/archive`);
  },

  getTaskList: (params: PaginationParams & {
    status?: string; assigneeId?: string; caseId?: string }): Promise<PaginationResult<Task>> => {
    return get<PaginationResult<Task>>('/workspace/tasks', { params });
  },

  getAllTasks: (): Promise<Task[]> => {
    return get<Task[]>('/workspace/tasks/all');
  },

  createTask: (data: CreateTaskParams): Promise<Task> => {
    return post<Task>('/workspace/tasks', data);
  },

  updateTaskStatus: (data: UpdateTaskStatusParams): Promise<Task> => {
    return put<Task>(`/workspace/tasks/${data.taskId}/status`, { status: data.status });
  },

  updateTask: (id: string, data: Partial<Task>): Promise<Task> => {
    return put<Task>(`/workspace/tasks/${id}`, data);
  },

  deleteTask: (id: string): Promise<void> => {
    return del(`/workspace/tasks/${id}`);
  },

  getEvidenceList: (caseId: string, folderId?: string): Promise<{ items: EvidenceItem[]; folders: EvidenceFolder[] }> => {
    return get(`/workspace/evidence`, { params: { caseId, folderId } });
  },

  uploadEvidence: (caseId: string, file: File, folderId?: string): Promise<EvidenceItem> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caseId', caseId);
    if (folderId) formData.append('folderId', folderId);
    return post<EvidenceItem>('/workspace/evidence/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  createFolder: (caseId: string, name: string, parentId?: string): Promise<EvidenceFolder> => {
    return post<EvidenceFolder>('/workspace/evidence/folders', { caseId, name, parentId });
  },

  deleteEvidence: (id: string): Promise<void> => {
    return del(`/workspace/evidence/${id}`);
  },

  updateCaseNode: (caseId: string, nodeId: string, data: { completed?: boolean; reminder?: boolean }): Promise<any> => {
    return put(`/workspace/cases/${caseId}/nodes/${nodeId}`, data);
  },

  addCaseNode: (caseId: string, data: { name: string; date: string; description?: string; reminder?: boolean }): Promise<any> => {
    return post(`/workspace/cases/${caseId}/nodes`, data);
  },

  getReminders: (): Promise<{ caseId: string; caseTitle: string; nodeName: string; date: string; type: string }[]> => {
    return get('/workspace/reminders');
  },
};
