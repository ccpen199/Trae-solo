import { get, post } from '../client'
import type {
  WorkflowTask,
  AuditRecord,
  AuditRequest,
  PagedResponse,
  PaginationParams
} from '../../types'

export const getTaskList = (
  params?: PaginationParams & { status?: string; businessType?: string }
): Promise<PagedResponse<WorkflowTask>> => {
  return get<PagedResponse<WorkflowTask>>('/workflow/tasks', params)
}

export const getTaskDetail = (id: number): Promise<WorkflowTask> => {
  return get<WorkflowTask>(`/workflow/task/${id}`)
}

export const getMyTasks = (
  params?: PaginationParams & { status?: string }
): Promise<PagedResponse<WorkflowTask>> => {
  return get<PagedResponse<WorkflowTask>>('/workflow/my-tasks', params)
}

export const getAuditRecords = (taskId: number): Promise<AuditRecord[]> => {
  return get<AuditRecord[]>(`/workflow/task/${taskId}/records`)
}

export const submitAudit = (data: AuditRequest): Promise<WorkflowTask> => {
  return post<WorkflowTask>('/workflow/audit', data)
}

export const claimTask = (taskId: number): Promise<WorkflowTask> => {
  return post<WorkflowTask>(`/workflow/task/${taskId}/claim`)
}

export const transferTask = (
  taskId: number,
  targetAuditorId: number
): Promise<WorkflowTask> => {
  return post<WorkflowTask>(`/workflow/task/${taskId}/transfer`, { targetAuditorId })
}

export const getTaskByBusinessId = (
  businessType: string,
  businessId: number
): Promise<WorkflowTask | null> => {
  return get<WorkflowTask | null>('/workflow/task/by-business', { businessType, businessId })
}

export const getPendingCount = (): Promise<number> => {
  return get<number>('/workflow/pending-count')
}

export default {
  getTaskList,
  getTaskDetail,
  getMyTasks,
  getAuditRecords,
  submitAudit,
  claimTask,
  transferTask,
  getTaskByBusinessId,
  getPendingCount
}
