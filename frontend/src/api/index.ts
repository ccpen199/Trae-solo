import api from './request';

export const authApi = {
  login: (phone: string, password: string) =>
    api.post('/auth/login', { phone, password }).then(r => r.data),
  register: (phone: string, password: string, nickname: string, role?: string) =>
    api.post('/auth/register', { phone, password, nickname, role }).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
  updateProfile: (data: any) => api.put('/auth/profile', data).then(r => r.data),
};

export const postApi = {
  create: (data: any) => api.post('/posts', data).then(r => r.data),
  feed: (params: any) => api.get('/posts/feed', { params }).then(r => r.data),
  getById: (id: string) => api.get(`/posts/${id}`).then(r => r.data),
  like: (id: string) => api.post(`/posts/${id}/like`).then(r => r.data),
  comment: (id: string, content: string, parentId?: string) =>
    api.post(`/posts/${id}/comments`, { content, parentId }).then(r => r.data),
  delete: (id: string) => api.delete(`/posts/${id}`).then(r => r.data),
};

export const topicApi = {
  list: (limit?: number) => api.get('/topics', { params: { limit } }).then(r => r.data),
  hot: () => api.get('/topics/hot').then(r => r.data),
  posts: (name: string, params?: any) =>
    api.get(`/topics/${encodeURIComponent(name)}/posts`, { params }).then(r => r.data),
};

export const merchantApi = {
  create: (data: any) => api.post('/merchants', data).then(r => r.data),
  nearby: (params: any) => api.get('/merchants/nearby', { params }).then(r => r.data),
  getById: (id: string) => api.get(`/merchants/${id}`).then(r => r.data),
  update: (id: string, data: any) => api.put(`/merchants/${id}`, data).then(r => r.data),
  pending: () => api.get('/merchants/pending/list').then(r => r.data),
  approve: (id: string) => api.post(`/merchants/${id}/approve`).then(r => r.data),
  reject: (id: string) => api.post(`/merchants/${id}/reject`).then(r => r.data),
};

export const couponApi = {
  create: (data: any) => api.post('/coupons', data).then(r => r.data),
  merchantList: (merchantId: string) =>
    api.get(`/coupons/merchant/${merchantId}`).then(r => r.data),
  claim: (id: string) => api.post(`/coupons/${id}/claim`).then(r => r.data),
  use: (id: string) => api.post(`/coupons/${id}/use`).then(r => r.data),
  myList: () => api.get('/coupons/my/list').then(r => r.data),
};

export const helpApi = {
  createRequest: (data: any) => api.post('/help/requests', data).then(r => r.data),
  listRequests: (params: any) => api.get('/help/requests', { params }).then(r => r.data),
  getRequest: (id: string) => api.get(`/help/requests/${id}`).then(r => r.data),
  respond: (id: string, content: string, images?: string[]) =>
    api.post(`/help/requests/${id}/respond`, { content, images }).then(r => r.data),
  accept: (id: string, responseId: string) =>
    api.post(`/help/requests/${id}/accept/${responseId}`).then(r => r.data),
  sendMessage: (id: string, content: string) =>
    api.post(`/help/requests/${id}/message`, { content }).then(r => r.data),
  myRequests: () => api.get('/help/my/requests').then(r => r.data),
  myResponses: () => api.get('/help/my/responses').then(r => r.data),
};

export const utilityApi = {
  services: (type?: string) =>
    api.get('/utilities/services', { params: { type } }).then(r => r.data),
  updates: (params?: any) =>
    api.get('/utilities/updates', { params }).then(r => r.data),
  busStations: (params: any) =>
    api.get('/utilities/bus/stations', { params }).then(r => r.data),
  testSites: (params?: any) =>
    api.get('/utilities/test-sites', { params }).then(r => r.data),
  subscribe: (type: string, targetId?: string) =>
    api.post('/utilities/subscribe', { type, targetId }).then(r => r.data),
  subscriptions: () => api.get('/utilities/subscriptions').then(r => r.data),
  unsubscribe: (id: string) => api.delete(`/utilities/subscriptions/${id}`).then(r => r.data),
};

export const adminApi = {
  pendingAudits: (params?: any) =>
    api.get('/admin/audit/pending', { params }).then(r => r.data),
  approvePost: (id: string, reason?: string) =>
    api.post(`/admin/audit/${id}/approve`, { reason }).then(r => r.data),
  rejectPost: (id: string, reason?: string, isRumor?: boolean) =>
    api.post(`/admin/audit/${id}/reject`, { reason, isRumor }).then(r => r.data),
  tracePost: (id: string) => api.get(`/admin/audit/trace/${id}`).then(r => r.data),
  merchantAnalytics: (merchantId: string) =>
    api.get(`/admin/merchant/analytics/${merchantId}`).then(r => r.data),
  dashboardOverview: () => api.get('/admin/dashboard/overview').then(r => r.data),
  dashboardHotspots: () => api.get('/admin/dashboard/hotspots').then(r => r.data),
};
