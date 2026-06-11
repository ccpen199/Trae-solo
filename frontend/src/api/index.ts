import { api } from "./client";
import type {
  User,
  Position,
  Candidate,
  Interview,
  Approval,
  IMMessage,
  TalentTag,
  DashboardStats,
  FunnelStageData,
  PositionHeatmapData,
  TalentTagStats,
  PaginatedResponse,
} from "../types";

export const authAPI = {
  login: (username: string, password: string) =>
    api.post<{ token: string; user: User }>("/auth/login", { username, password }),
  logout: () => api.post("/auth/logout"),
  getCurrentUser: () => api.get<{ user: User }>("/auth/me"),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.put("/auth/password", { oldPassword, newPassword }),
  register: (data: any) => api.post("/auth/register", data),
};

export const positionAPI = {
  getList: (params?: any) =>
    api.get<PaginatedResponse<Position>>("/positions", { params }),
  getById: (id: number) => api.get<Position>(`/positions/${id}`),
  create: (data: Partial<Position>) => api.post<Position>("/positions", data),
  update: (id: number, data: Partial<Position>) =>
    api.put<Position>(`/positions/${id}`, data),
  delete: (id: number) => api.delete(`/positions/${id}`),
  submitApproval: (id: number, approverId?: number) =>
    api.post(`/positions/${id}/submit-approval`, { approverId }),
  publish: (id: number, data?: { channels?: string[]; publishChannels?: string[]; reason?: string }) =>
    api.post(`/positions/${id}/publish`, data),
  close: (id: number) => api.post(`/positions/${id}/close`),
  syncToATS: (id: number) => api.post(`/positions/${id}/sync-ats`),
  generateJD: (data: { title: string; department: string; keywords?: string[] }) =>
    api.post("/positions/generate-jd", data),
};

export const candidateAPI = {
  getList: (params?: any) =>
    api.get<PaginatedResponse<Candidate>>("/candidates", { params }),
  getById: (id: number) => api.get<Candidate>(`/candidates/${id}`),
  getKanban: (positionId?: number) =>
    api.get<{
      data: Array<{ stage: string; stageName: string; candidates: Candidate[]; count: number }>;
    }>("/candidates/kanban", { params: { positionId } }),
  create: (data: Partial<Candidate>) =>
    api.post<Candidate>("/candidates", data),
  update: (id: number, data: Partial<Candidate>) =>
    api.put<Candidate>(`/candidates/${id}`, data),
  updateStage: (id: number, stage: string, reason?: string) =>
    api.put(`/candidates/${id}/stage`, { stage, reason }),
  aiScreening: (id: number) =>
    api.post<{ message: string; result: any }>(`/candidates/${id}/ai-screening`),
  batchAIScreening: (candidateIds: number[]) =>
    api.post("/candidates/batch-ai-screening", { candidateIds }),
  uploadResume: (candidateId: number, file: File) => {
    const formData = new FormData();
    formData.append("candidateId", String(candidateId));
    formData.append("resume", file);
    return api.upload("/candidates/upload-resume", formData);
  },
  updateOnboardingChecklist: (id: number, itemIndex: number, completed: boolean) =>
    api.put(`/candidates/${id}/onboarding-checklist`, { itemIndex, completed }),
};

export const interviewAPI = {
  getList: (params?: any) =>
    api.get<PaginatedResponse<Interview>>("/interviews", { params }),
  getById: (id: number) => api.get<Interview>(`/interviews/${id}`),
  create: (data: Partial<Interview>) =>
    api.post<Interview>("/interviews", data),
  update: (id: number, data: Partial<Interview>) =>
    api.put<Interview>(`/interviews/${id}`, data),
  start: (id: number) => api.post(`/interviews/${id}/start`),
  end: (id: number) => api.post(`/interviews/${id}/end`),
  saveTranscript: (id: number, transcriptData: any[]) =>
    api.post(`/interviews/${id}/transcript`, { transcriptData }),
  addBehaviorMarker: (id: number, data: any) =>
    api.post(`/interviews/${id}/behavior-marker`, data),
  submitEvaluation: (id: number, evaluation: any) =>
    api.post(`/interviews/${id}/evaluation`, evaluation),
  generateQuestions: (position: any, round: string) =>
    api.post<{ questions: string[] }>("/interviews/generate-questions", { position, round }),
  cancel: (id: number, reason?: string) =>
    api.post(`/interviews/${id}/cancel`, { reason }),
  getRoomInfo: (roomId: string) => api.get(`/interviews/room/${roomId}`),
};

export const approvalAPI = {
  getList: (params?: any) =>
    api.get<PaginatedResponse<Approval>>("/approvals", { params }),
  getById: (id: number) => api.get<Approval>(`/approvals/${id}`),
  getStats: () =>
    api.get<{ pending: number; approved: number; rejected: number; myPending: number }>(
      "/approvals/stats"
    ),
  approve: (id: number, comments?: string) =>
    api.post(`/approvals/${id}/approve`, { comments }),
  reject: (id: number, comments: string) =>
    api.post(`/approvals/${id}/reject`, { comments }),
  cancel: (id: number) => api.post(`/approvals/${id}/cancel`),
};

export const imAPI = {
  getConversations: () =>
    api.get<{
      data: Array<{ userId: number; user: User; lastMessage: IMMessage; unreadCount: number }>;
    }>("/im/conversations"),
  getMessages: (userId: number, limit?: number) =>
    api.get<{ data: IMMessage[] }>(`/im/messages/${userId}`, { params: { limit } }),
  sendMessage: (receiverId: number, type: string, content?: string, file?: File) => {
    if (file) {
      const formData = new FormData();
      formData.append("receiverId", String(receiverId));
      formData.append("type", type);
      if (content) formData.append("content", content);
      formData.append("file", file);
      return api.upload<IMMessage>("/im/messages", formData);
    }
    return api.post<IMMessage>("/im/messages", { receiverId, type, content });
  },
  markAsRead: (senderId: number) =>
    api.post(`/im/messages/${senderId}/read`),
  getUnreadCount: () =>
    api.get<{ total: number; bySender: Record<number, number> }>("/im/unread-count"),
  deleteMessage: (id: number) => api.delete(`/im/messages/${id}`),
  getAuditPending: () =>
    api.get<{ data: IMMessage[] }>("/im/audit/pending"),
  auditMessage: (id: number, result: string, notes?: string, violationType?: string) =>
    api.post(`/im/audit/${id}`, { result, notes, violationType }),
};

export const analyticsAPI = {
  getDashboardStats: (params?: { startDate?: string; endDate?: string }) =>
    api.get<DashboardStats>("/analytics/dashboard", { params }),
  getFunnel: (params?: { positionId?: number; startDate?: string; endDate?: string }) =>
    api.get<{ data: FunnelStageData[] }>("/analytics/funnel", { params }),
  getHeatmap: (params?: { startDate?: string; endDate?: string }) =>
    api.get<{ data: PositionHeatmapData[] }>("/analytics/heatmap", { params }),
  getTagStats: (category?: string) =>
    api.get<{ data: TalentTagStats[] }>("/analytics/tag-stats", { params: { category } }),
  getTags: (category?: string) =>
    api.get<{ data: TalentTag[] }>("/tags", { params: { category } }),
  createTag: (data: Partial<TalentTag>) =>
    api.post<TalentTag>("/tags", data),
  updateTag: (id: number, data: Partial<TalentTag>) =>
    api.put<TalentTag>(`/tags/${id}`, data),
  deleteTag: (id: number) => api.delete(`/tags/${id}`),
  getAuditLogs: (params?: any) =>
    api.get<PaginatedResponse<any>>("/audit-logs", { params }),
  getUsers: (role?: string) =>
    api.get<{ data: User[] }>("/users", { params: { role } }),
};

export const healthAPI = {
  check: () => api.get("/health"),
};
