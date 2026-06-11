import request from './request';
import type { LoginRequest, LoginResponse, ApiResponse, CreateWorkOrderRequest, CreateVisitorRequest, UpdateWorkOrderStatusRequest } from '@shared/types';

export const authApi = {
  login: (data: LoginRequest): Promise<ApiResponse<LoginResponse>> =>
    request.post('/auth/login', data),
  getCurrentUser: (): Promise<ApiResponse> => request.get('/auth/me'),
};

export const accessApi = {
  getVisitorPasses: (status?: string): Promise<ApiResponse> =>
    request.get('/access/passes', { params: { status } }),
  createVisitorPass: (data: CreateVisitorRequest): Promise<ApiResponse> =>
    request.post('/access/passes', data),
  getAccessRecords: (limit = 20, offset = 0): Promise<ApiResponse> =>
    request.get('/access/records', { params: { limit, offset } }),
  getAccessDevices: (): Promise<ApiResponse> => request.get('/access/devices'),
  verifyPass: (qrCode: string): Promise<ApiResponse> =>
    request.post('/access/verify', { qrCode }),
};

export const workOrderApi = {
  getWorkOrders: (params?: { status?: string; type?: string; limit?: number; offset?: number }): Promise<ApiResponse> =>
    request.get('/workorder', { params }),
  getWorkOrderDetail: (id: number): Promise<ApiResponse> =>
    request.get(`/workorder/${id}`),
  createWorkOrder: (data: CreateWorkOrderRequest): Promise<ApiResponse> =>
    request.post('/workorder', data),
  updateWorkOrderStatus: (id: number, data: UpdateWorkOrderStatusRequest): Promise<ApiResponse> =>
    request.patch(`/workorder/${id}/status`, data),
  evaluateWorkOrder: (id: number, data: { rating: number; comment?: string }): Promise<ApiResponse> =>
    request.post(`/workorder/${id}/evaluate`, data),
};

export const mallApi = {
  getMerchants: (status?: string): Promise<ApiResponse> =>
    request.get('/mall/merchants', { params: { status } }),
  getMerchantDetail: (id: number): Promise<ApiResponse> =>
    request.get(`/mall/merchants/${id}`),
  getProducts: (params?: { merchantId?: number; category?: string; keyword?: string }): Promise<ApiResponse> =>
    request.get('/mall/products', { params }),
  getCoupons: (available?: boolean): Promise<ApiResponse> =>
    request.get('/mall/coupons', { params: { available: available ? 'true' : undefined } }),
  getOrders: (status?: string): Promise<ApiResponse> =>
    request.get('/mall/orders', { params: { status } }),
  createOrder: (data: { merchantId: number; productId: number; quantity: number; couponId?: number }): Promise<ApiResponse> =>
    request.post('/mall/orders', data),
  redeemCoupon: (couponId: number): Promise<ApiResponse> =>
    request.post(`/mall/coupons/${couponId}/redeem`),
};

export const socialApi = {
  getCircles: (): Promise<ApiResponse> => request.get('/social/circles'),
  getPosts: (params?: { circleId?: number; type?: string }): Promise<ApiResponse> =>
    request.get('/social/posts', { params }),
  createPost: (data: { circleId?: number; title: string; content: string; type?: string; images?: string[] }): Promise<ApiResponse> =>
    request.post('/social/posts', data),
  likePost: (id: number): Promise<ApiResponse> =>
    request.post(`/social/posts/${id}/like`),
  getPostComments: (postId: number): Promise<ApiResponse> =>
    request.get(`/social/posts/${postId}/comments`),
  addComment: (postId: number, content: string): Promise<ApiResponse> =>
    request.post(`/social/posts/${postId}/comments`, { content }),
  getActivities: (status?: string): Promise<ApiResponse> =>
    request.get('/social/activities', { params: { status } }),
  createActivity: (data: { title: string; description: string; startTime: string; endTime: string; location?: string; maxParticipants?: number }): Promise<ApiResponse> =>
    request.post('/social/activities', data),
  signupActivity: (activityId: number): Promise<ApiResponse> =>
    request.post(`/social/activities/${activityId}/signup`),
};

export const analyticsApi = {
  getPropertyKPI: (): Promise<ApiResponse> => request.get('/analytics/property/kpi'),
  getMerchantAnalytics: (): Promise<ApiResponse> => request.get('/analytics/merchant'),
  getMemberProfile: (): Promise<ApiResponse> => request.get('/analytics/profile'),
};

export const riskApi = {
  getAlerts: (params?: { status?: string; level?: string; type?: string }): Promise<ApiResponse> =>
    request.get('/risk/alerts', { params }),
  getAlertDetail: (id: number): Promise<ApiResponse> =>
    request.get(`/risk/alerts/${id}`),
  handleAlert: (id: number, data: { status: string; remark?: string }): Promise<ApiResponse> =>
    request.post(`/risk/alerts/${id}/handle`, data),
  createAlert: (data: { type: string; level: string; title: string; description?: string; location?: string; imageUrl?: string }): Promise<ApiResponse> =>
    request.post('/risk/alerts', data),
  getAbnormalVisitors: (): Promise<ApiResponse> => request.get('/risk/abnormal-visitors'),
};
