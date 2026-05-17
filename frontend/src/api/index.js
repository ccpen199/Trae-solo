import api from './client';

export const authApi = {
  sendCode: (phone) => api.post('/auth/send-code', { phone }),
  loginCode: (phone, code) => api.post('/auth/login-code', { phone, code }),
  loginPassword: (phone, password) => api.post('/auth/login-password', { phone, password }),
  getProfile: () => api.get('/auth/profile'),
};

export const videoApi = {
  getHome: (params) => api.get('/video/home', { params }),
  getDetail: (id) => api.get(`/video/detail/${id}`),
  like: (id) => api.post(`/video/like/${id}`),
  getDanmaku: (id) => api.get(`/video/danmaku/${id}`),
  sendDanmaku: (id, data) => api.post(`/video/danmaku/${id}`, data),
  search: (keyword, params) => api.get('/video/search', { params: { keyword, ...params } }),
};

export const commentApi = {
  getList: (videoId, params) => api.get(`/comment/list/${videoId}`, { params }),
  publish: (videoId, data) => api.post(`/comment/publish/${videoId}`, data),
  like: (id) => api.post(`/comment/like/${id}`),
};

export const messageApi = {
  getNotifications: (params) => api.get('/message/notifications', { params }),
  getConversations: () => api.get('/message/conversations'),
  getConversation: (userId, params) => api.get(`/message/conversation/${userId}`, { params }),
  send: (userId, content) => api.post(`/message/send/${userId}`, { content }),
  getContacts: () => api.get('/message/contacts'),
  follow: (userId) => api.post(`/message/follow/${userId}`),
};
