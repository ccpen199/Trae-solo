import { api } from '../store/apiClient';
import type {
  User, Task, Talent, Bid, Submission, Message, Conversation, Wallet,
  Transaction, Dispute, DashboardStats, ApiResponse, TaskCreateRequest,
  BidCreateRequest, SubmissionCreateRequest, SubmissionReviewRequest,
  MessageCreateRequest, EscrowRequest, ReleaseRequest, WithdrawRequest,
  DisputeCreateRequest, DisputeResolveRequest, TaskListQuery, TaskStatus, TalentLevel, AuditLog
} from '../../shared/types';

export const authApi = {
  login: (email: string, password: string, role: User['role']) =>
    api.post<{ token: string; user: User }>('/auth/login', { email, password, role }, { requireAuth: false }),
  register: (data: { email: string; password: string; name: string; phone: string; role: User['role'] }) =>
    api.post<{ token: string; user: User }>('/auth/register', data, { requireAuth: false }),
  getCurrentUser: () => api.get<User>('/auth/me'),
  logout: () => api.post<void>('/auth/logout'),
};

export const taskApi = {
  getList: (query?: TaskListQuery) => api.get<{ data: Task[]; total: number; page: number; pageSize: number }>(
    `/tasks?${new URLSearchParams(query as unknown as Record<string, string>).toString()}`
  ),
  getById: (id: number) => api.get<Task>(`/tasks/${id}`),
  create: (data: TaskCreateRequest) => api.post<Task>('/tasks', data),
  update: (id: number, data: Partial<TaskCreateRequest>) => api.put<Task>(`/tasks/${id}`, data),
  delete: (id: number) => api.delete<void>(`/tasks/${id}`),
  publish: (id: number) => api.post<Task>(`/tasks/${id}/publish`),
  createBid: (taskId: number, data: BidCreateRequest) => api.post<Bid>(`/tasks/${taskId}/bids`, data),
  selectProvider: (taskId: number, providerId: number, bidId: number) =>
    api.post<Task>(`/tasks/${taskId}/select`, { providerId, bidId }),
  getMatchingTalents: (taskId: number) => api.get<Talent[]>(`/talents/matching/${taskId}`),
};

export const submissionApi = {
  getByTask: (taskId: number) => api.get<Submission[]>(`/submissions/task/${taskId}`),
  create: (taskId: number, data: SubmissionCreateRequest) => api.post<Submission>(`/submissions/task/${taskId}`, data),
  review: (id: number, data: SubmissionReviewRequest) => api.post<Submission>(`/submissions/${id}/review`, data),
  getIPRecords: (taskId: number) => api.get<{ fileHash: string; fileName: string; timestamp: number; createdAt: string }[]>(`/submissions/task/${taskId}/ip-records`),
};

export const talentApi = {
  getList: (query?: { page?: number; pageSize?: number; skill?: string; level?: TalentLevel; verified?: boolean }) =>
    api.get<{ data: Talent[]; total: number; page: number; pageSize: number }>(
      `/talents?${new URLSearchParams(query as unknown as Record<string, string>).toString()}`
    ),
  getById: (id: number) => api.get<Talent>(`/talents/${id}`),
  verify: (id: number, verified: boolean, level: TalentLevel) =>
    api.post<Talent>(`/talents/${id}/verify`, { verified, level }),
};

export const messageApi = {
  getConversations: () => api.get<Conversation[]>('/messages/conversations'),
  getUnreadCount: () => api.get<{ total: number; conversations: { taskId: number; count: number }[] }>('/messages/unread-count'),
  getMessages: (taskId: number) => api.get<Message[]>(`/messages/task/${taskId}`),
  send: (taskId: number, data: MessageCreateRequest) => api.post<Message>(`/messages/task/${taskId}`, data),
};

export const financeApi = {
  getWallet: () => api.get<Wallet>('/finance/wallet'),
  getTransactions: (query?: { page?: number; pageSize?: number; type?: string }) =>
    api.get<{ data: Transaction[]; total: number; page: number; pageSize: number }>(
      `/finance/transactions?${new URLSearchParams(query as unknown as Record<string, string>).toString()}`
    ),
  getDashboardStats: () => api.get<DashboardStats>('/finance/dashboard-stats'),
  escrow: (data: EscrowRequest) => api.post<Transaction>('/finance/escrow', data),
  release: (data: ReleaseRequest) => api.post<Transaction[]>('/finance/release', data),
  withdraw: (data: WithdrawRequest) => api.post<Transaction>('/finance/withdraw', data),
};

export const disputeApi = {
  getList: (query?: { page?: number; pageSize?: number; status?: Dispute['status'] }) =>
    api.get<{ data: Dispute[]; total: number; page: number; pageSize: number }>(
      `/disputes?${new URLSearchParams(query as unknown as Record<string, string>).toString()}`
    ),
  create: (data: DisputeCreateRequest) => api.post<Dispute>('/disputes', data),
  resolve: (id: number, data: DisputeResolveRequest) => api.post<Dispute>(`/disputes/${id}/resolve`, data),
};

export const adminApi = {
  getPlatformStats: () => api.get<{ totalUsers: number; totalTasks: number; completedTasks: number; platformRevenue: number; pendingDisputes: number; pendingVerifications: number }>('/admin/platform-stats'),
  getTaskBoard: (status?: TaskStatus) => api.get<Record<TaskStatus, Task[]>>(`/admin/task-board${status ? `?status=${status}` : ''}`),
  updateTaskStatus: (id: number, status: TaskStatus) => api.put<Task>(`/admin/tasks/${id}/status`, { status }),
  getTalents: (query?: { page?: number; pageSize?: number; level?: TalentLevel; verified?: boolean }) =>
    api.get<{ data: Talent[]; total: number; page: number; pageSize: number }>(
      `/admin/talents?${new URLSearchParams(query as unknown as Record<string, string>).toString()}`
    ),
  getAuditLogs: (query?: { page?: number; pageSize?: number; userId?: number; action?: string; resourceType?: string; startDate?: string; endDate?: string }) =>
    api.get<{ data: AuditLog[]; total: number; page: number; pageSize: number }>(
      `/admin/audit-logs?${new URLSearchParams(query as unknown as Record<string, string>).toString()}`
    ),
};
