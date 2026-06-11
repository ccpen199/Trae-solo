import api from './axios';
import type {
  User,
  LoginRequest,
  LoginResponse,
  Content,
  ContentType,
  ContentStatus,
  AuditRecord,
  AuditActionRequest,
  ScenicSpot,
  ScenicSpotFlow,
  OTABooking,
  Heritage,
  CouponConsumption,
  Dashboard,
  OpenApi,
  InvestmentProject,
  FestivalActivity,
  GuideCertification,
  PropagationPath,
  SentimentDistribution,
  SentimentTrend,
} from '../../shared/types';
import type { ApiResponse, PageResponse, PageParams } from './axios';

export const authApi = {
  login: (data: LoginRequest): Promise<ApiResponse<LoginResponse>> =>
    api.post('/auth/login', data),
  logout: (): Promise<ApiResponse<null>> => api.post('/auth/logout'),
  refresh: (refreshToken: string): Promise<ApiResponse<LoginResponse>> =>
    api.post('/auth/refresh', { refreshToken }),
  getCurrentUser: (): Promise<ApiResponse<User & { permissions: string[] }>> =>
    api.get('/auth/me'),
};

export const contentApi = {
  getList: (params?: PageParams & {
    status?: ContentStatus;
    type?: ContentType;
    category?: string;
    region?: string;
  }): Promise<ApiResponse<PageResponse<Content>>> =>
    api.get('/content', { params }),
  getDetail: (id: string): Promise<ApiResponse<Content>> =>
    api.get(`/content/${id}`),
  create: (data: Partial<Content>): Promise<ApiResponse<Content>> =>
    api.post('/content', data),
  update: (id: string, data: Partial<Content>): Promise<ApiResponse<Content>> =>
    api.put(`/content/${id}`, data),
  delete: (id: string): Promise<ApiResponse<null>> =>
    api.delete(`/content/${id}`),
  submitAudit: (id: string): Promise<ApiResponse<Content>> =>
    api.post(`/content/${id}/submit-audit`),
  publish: (id: string): Promise<ApiResponse<Content>> =>
    api.post(`/content/${id}/publish`),
  offline: (id: string): Promise<ApiResponse<Content>> =>
    api.post(`/content/${id}/offline`),
  securityCheck: (id: string): Promise<ApiResponse<{ safe: boolean; risk: string; suggestions: string[] }>> =>
    api.post(`/content/${id}/security-check`),
  like: (id: string): Promise<ApiResponse<{ likes: number }>> =>
    api.post(`/content/${id}/like`),
  share: (id: string): Promise<ApiResponse<{ shares: number }>> =>
    api.post(`/content/${id}/share`),
};

export const auditApi = {
  getPending: (params?: PageParams & {
    auditLevel?: number;
    contentType?: ContentType;
  }): Promise<ApiResponse<PageResponse<Content & { currentAuditLevel: number }>>> =>
    api.get('/audit/pending', { params }),
  getRecords: (params?: PageParams & {
    contentId?: string;
  }): Promise<ApiResponse<PageResponse<AuditRecord>>> =>
    api.get('/audit/records', { params }),
  getContentRecords: (contentId: string): Promise<ApiResponse<AuditRecord[]>> =>
    api.get(`/audit/content/${contentId}/records`),
  getAuditSummary: (contentId: string): Promise<ApiResponse<{
    currentLevel: number;
    totalLevels: number;
    records: AuditRecord[];
    status: string;
  }>> =>
    api.get(`/audit/content/${contentId}/summary`),
  action: (data: AuditActionRequest): Promise<ApiResponse<AuditRecord>> =>
    api.post('/audit/action', data),
  revoke: (contentId: string): Promise<ApiResponse<null>> =>
    api.post(`/audit/content/${contentId}/revoke`),
  getStatistics: (): Promise<ApiResponse<{
    pendingByLevel: Record<number, number>;
    todayApproved: number;
    todayRejected: number;
    totalPending: number;
  }>> =>
    api.get('/audit/statistics'),
};

export const dataApi = {
  getScenicSpots: (params?: PageParams & {
    region?: string;
    level?: string;
  }): Promise<ApiResponse<PageResponse<ScenicSpot>>> =>
    api.get('/data/scenic-spots', { params }),
  getScenicFlows: (params?: PageParams & {
    scenicSpotId?: string;
    startDate?: string;
    endDate?: string;
    region?: string;
  }): Promise<ApiResponse<PageResponse<ScenicSpotFlow>>> =>
    api.get('/data/scenic-flows', { params }),
  getScenicFlowTrend: (params: {
    scenicSpotId?: string;
    startDate: string;
    endDate: string;
    aggregation?: 'day' | 'week' | 'month';
  }): Promise<ApiResponse<{ date: string; visitorCount: number; saturation: number }[]>> =>
    api.get('/data/scenic-flows/trend', { params }),
  getOTABookings: (params?: PageParams & {
    platform?: string;
    scenicSpotId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<PageResponse<OTABooking>>> =>
    api.get('/data/ota-bookings', { params }),
  getOTAAggregation: (params: {
    startDate: string;
    endDate: string;
    groupBy: 'platform' | 'scenicSpot' | 'date';
  }): Promise<ApiResponse<{ key: string; bookingCount: number; totalAmount: number }[]>> =>
    api.get('/data/ota-bookings/aggregation', { params }),
  getHeritages: (params?: PageParams & {
    level?: 'national' | 'provincial' | 'municipal';
    category?: string;
    region?: string;
  }): Promise<ApiResponse<PageResponse<Heritage>>> =>
    api.get('/data/heritages', { params }),
  getHeritageStatsByLevel: (): Promise<ApiResponse<{ level: string; count: number; name: string }[]>> =>
    api.get('/data/heritages/stats/by-level'),
  getCouponConsumptions: (params?: PageParams & {
    region?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<PageResponse<CouponConsumption>>> =>
    api.get('/data/coupon-consumptions', { params }),
  getCouponStatistics: (params?: {
    startDate?: string;
    endDate?: string;
    region?: string;
  }): Promise<ApiResponse<{
    totalIssued: number;
    totalConsumed: number;
    consumptionRate: number;
    totalAmount: number;
    dailyTrend: { date: string; consumed: number; amount: number }[];
  }>> =>
    api.get('/data/coupon-consumptions/statistics', { params }),
  getDashboards: (params?: PageParams): Promise<ApiResponse<PageResponse<Dashboard>>> =>
    api.get('/data/dashboards', { params }),
  getDashboardDetail: (id: string): Promise<ApiResponse<Dashboard>> =>
    api.get(`/data/dashboards/${id}`),
  getDashboardData: (id: string): Promise<ApiResponse<Record<string, unknown>>> =>
    api.get(`/data/dashboards/${id}/data`),
  getOpenApis: (params?: PageParams & {
    category?: string;
  }): Promise<ApiResponse<PageResponse<OpenApi>>> =>
    api.get('/data/openapi/apis', { params }),
};

export const serviceApi = {
  getInvestmentProjects: (params?: PageParams & {
    status?: string;
    region?: string;
    projectType?: string;
  }): Promise<ApiResponse<PageResponse<InvestmentProject>>> =>
    api.get('/service/investment/projects', { params }),
  getInvestmentDetail: (id: string): Promise<ApiResponse<InvestmentProject>> =>
    api.get(`/service/investment/projects/${id}`),
  createInvestment: (data: Partial<InvestmentProject>): Promise<ApiResponse<InvestmentProject>> =>
    api.post('/service/investment/projects', data),
  updateInvestmentStatus: (id: string, status: string, remark?: string): Promise<ApiResponse<InvestmentProject>> =>
    api.put(`/service/investment/projects/${id}/status`, { status, remark }),

  getFestivals: (params?: PageParams & {
    status?: string;
    region?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<PageResponse<FestivalActivity>>> =>
    api.get('/service/festival/activities', { params }),
  getFestivalDetail: (id: string): Promise<ApiResponse<FestivalActivity>> =>
    api.get(`/service/festival/activities/${id}`),
  createFestival: (data: Partial<FestivalActivity>): Promise<ApiResponse<FestivalActivity>> =>
    api.post('/service/festival/activities', data),
  submitFestival: (id: string): Promise<ApiResponse<FestivalActivity>> =>
    api.post(`/service/festival/activities/${id}/submit`),
  approveFestival: (id: string, approved: boolean, remark?: string): Promise<ApiResponse<FestivalActivity>> =>
    api.post(`/service/festival/activities/${id}/approve`, { approved, remark }),

  getGuideCerts: (params?: PageParams & {
    status?: string;
    guideId?: string;
  }): Promise<ApiResponse<PageResponse<GuideCertification>>> =>
    api.get('/service/guide/certifications', { params }),
  getGuideCertDetail: (id: string): Promise<ApiResponse<GuideCertification>> =>
    api.get(`/service/guide/certifications/${id}`),
  submitGuideCert: (data: Partial<GuideCertification>): Promise<ApiResponse<GuideCertification>> =>
    api.post('/service/guide/certifications', data),
  approveGuideCert: (id: string, approved: boolean, licenseNumber?: string): Promise<ApiResponse<GuideCertification>> =>
    api.post(`/service/guide/certifications/${id}/approve`, { approved, licenseNumber }),
};

export const analyticsApi = {
  getPropagationPath: (contentId: string): Promise<ApiResponse<PropagationPath>> =>
    api.get(`/analytics/propagation/path/${contentId}`),
  getPropagationNodes: (contentId: string): Promise<ApiResponse<{
    totalNodes: number;
    totalViews: number;
    platformStats: { platform: string; count: number; views: number }[];
    topNodes: { id: string; name: string; platform: string; views: number; shares: number }[];
  }>> =>
    api.get(`/analytics/propagation/nodes/${contentId}`),
  getSentimentDistribution: (contentId: string): Promise<ApiResponse<SentimentDistribution>> =>
    api.get(`/analytics/sentiment/distribution/${contentId}`),
  getSentimentTrend: (contentId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<SentimentTrend[]>> =>
    api.get(`/analytics/sentiment/trend/${contentId}`, { params }),
};
