import request from '@/utils/request';
import type {
  Agent,
  LoginRequest,
  LoginResponse,
  Property,
  PropertyCreateRequest,
  Customer,
  CustomerCreateRequest,
  Demand,
  Commission,
  KnowledgeContent,
  KnowledgeCreateRequest,
  Promotion,
  PromotionCreateRequest,
  DashboardStats,
  PaginatedResponse,
  PaginationParams,
  DuplicateCheckResponse,
  AITagResponse,
  PaymentVoucher,
  AgentQualification,
  CrawlTask,
  CrawlResult,
} from '@/types';

export const authAPI = {
  login: (data: LoginRequest): Promise<LoginResponse> =>
    request.post('/agents/login', data),

  getCurrentUser: (): Promise<Agent> =>
    request.get('/agents/me'),

  logout: (): Promise<void> =>
    request.post('/agents/logout'),
};

export const dashboardAPI = {
  getStats: (): Promise<DashboardStats> =>
    request.get('/dashboard/stats'),
};

export const propertyAPI = {
  getList: (params: PaginationParams & { type?: string; district?: string; keyword?: string }): Promise<PaginatedResponse<Property>> =>
    request.get('/properties', { params }),

  getDetail: (id: number): Promise<Property> =>
    request.get(`/properties/${id}`),

  create: (data: PropertyCreateRequest): Promise<Property> =>
    request.post('/properties', data),

  update: (id: number, data: Partial<PropertyCreateRequest>): Promise<Property> =>
    request.put(`/properties/${id}`, data),

  delete: (id: number): Promise<void> =>
    request.delete(`/properties/${id}`),

  checkDuplicate: (data: { title: string; owner_phone: string; address: string }): Promise<DuplicateCheckResponse> =>
    request.post('/properties/check-duplicate', data),

  generateAITags: (text: string): Promise<AITagResponse> =>
    request.post('/properties/ai-tags', { text }),
};

export const customerAPI = {
  getList: (params: PaginationParams & { type?: string; keyword?: string }): Promise<PaginatedResponse<Customer>> =>
    request.get('/customers', { params }),

  getDetail: (id: number): Promise<Customer> =>
    request.get(`/customers/${id}`),

  create: (data: CustomerCreateRequest): Promise<Customer> =>
    request.post('/customers', data),

  update: (id: number, data: Partial<CustomerCreateRequest>): Promise<Customer> =>
    request.put(`/customers/${id}`, data),

  delete: (id: number): Promise<void> =>
    request.delete(`/customers/${id}`),

  generateAITags: (text: string): Promise<AITagResponse> =>
    request.post('/customers/ai-tags', { text }),

  addFollowUp: (id: number, content: string): Promise<void> =>
    request.post(`/customers/${id}/follow-up`, { content }),
};

export const demandAPI = {
  getList: (params: PaginationParams & { type?: string; district?: string; budget_min?: number; budget_max?: number }): Promise<PaginatedResponse<Demand>> =>
    request.get('/demands', { params }),

  getMyDemands: (): Promise<Demand[]> =>
    request.get('/demands/mine'),

  grab: (id: number): Promise<{ success: boolean; message: string }> =>
    request.post(`/demands/${id}/grab`),

  confirmDeal: (id: number, data: { property_id: number; deal_amount: number }): Promise<Commission> =>
    request.post(`/demands/${id}/deal`, data),
};

export const commissionAPI = {
  getList: (params: PaginationParams & { status?: string }): Promise<PaginatedResponse<Commission>> =>
    request.get('/commissions', { params }),

  getVoucher: (id: number): Promise<PaymentVoucher> =>
    request.get(`/commissions/${id}/voucher`),
};

export const knowledgeAPI = {
  getList: (params: PaginationParams & { type?: string; category?: string; keyword?: string; audit_status?: string }): Promise<PaginatedResponse<KnowledgeContent>> =>
    request.get('/knowledge', { params }),

  getDetail: (id: number): Promise<KnowledgeContent> =>
    request.get(`/knowledge/${id}`),

  create: (data: KnowledgeCreateRequest): Promise<KnowledgeContent> =>
    request.post('/knowledge', data),

  like: (id: number): Promise<void> =>
    request.post(`/knowledge/${id}/like`),

  audit: (id: number, data: { status: 'approved' | 'rejected'; reason?: string }): Promise<void> =>
    request.post(`/knowledge/${id}/audit`, data),
};

export const promotionAPI = {
  getList: (params: PaginationParams): Promise<PaginatedResponse<Promotion>> =>
    request.get('/promotions', { params }),

  create: (data: PromotionCreateRequest): Promise<Promotion[]> =>
    request.post('/promotions', data),

  getBrochure: (id: number): Promise<any> =>
    request.get(`/promotions/brochure/${id}`),
};

export const crawlerAPI = {
  createTask: (data: { platforms: string[]; districts: string[]; min_score: number }): Promise<CrawlTask> =>
    request.post('/crawler/tasks', data),

  getTasks: (): Promise<CrawlTask[]> =>
    request.get('/crawler/tasks'),

  getResults: (taskId: number): Promise<CrawlResult[]> =>
    request.get(`/crawler/tasks/${taskId}/results`),

  approveResult: (id: number): Promise<Property> =>
    request.post(`/crawler/results/${id}/approve`),

  rejectResult: (id: number, reason: string): Promise<void> =>
    request.post(`/crawler/results/${id}/reject`, { reason }),
};

export const agentAPI = {
  getQualification: (): Promise<AgentQualification> =>
    request.get('/agents/qualification'),

  updateQualification: (data: Omit<AgentQualification, 'id' | 'agent_id' | 'verified' | 'verified_at'>): Promise<AgentQualification> =>
    request.post('/agents/qualification', data),

  updateProfile: (data: { name: string; avatar?: string }): Promise<Agent> =>
    request.put('/agents/profile', data),
};
