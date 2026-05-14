import request from './request';

export const userApi = {
  register: (data) => request.post('/users/register', data),
  login: (data) => request.post('/users/login', data),
  getMe: () => request.get('/users/me'),
  getUser: (id) => request.get(`/users/${id}`),
  updateMe: (data) => request.put('/users/me', data),
  changePassword: (data) => request.post('/users/change-password', data),
  changePhone: (data) => request.post('/users/change-phone', data),
  forgotPassword: (data) => request.post('/users/forgot-password', data)
};

export const questionApi = {
  getList: (params) => request.get('/questions', { params }),
  getDetail: (id) => request.get(`/questions/${id}`),
  create: (data) => request.post('/questions', data),
  update: (id, data) => request.put(`/questions/${id}`, data),
  delete: (id) => request.delete(`/questions/${id}`),
  like: (id) => request.post(`/questions/${id}/like`),
  favorite: (id) => request.post(`/questions/${id}/favorite`),
  report: (id, data) => request.post(`/questions/${id}/report`, data)
};

export const articleApi = {
  getList: (params) => request.get('/articles', { params }),
  getDetail: (id) => request.get(`/articles/${id}`),
  create: (data) => request.post('/articles', data),
  update: (id, data) => request.put(`/articles/${id}`, data),
  delete: (id) => request.delete(`/articles/${id}`),
  like: (id) => request.post(`/articles/${id}/like`),
  favorite: (id) => request.post(`/articles/${id}/favorite`),
  report: (id, data) => request.post(`/articles/${id}/report`, data)
};

export const answerApi = {
  getList: (questionId, params) => request.get(`/answers/question/${questionId}`, { params }),
  create: (data) => request.post('/answers', data),
  like: (id) => request.post(`/answers/${id}/like`),
  accept: (id) => request.post(`/answers/${id}/accept`),
  delete: (id) => request.delete(`/answers/${id}`)
};

export const commentApi = {
  getList: (params) => request.get('/comments', { params }),
  create: (data) => request.post('/comments', data),
  like: (id) => request.post(`/comments/${id}/like`),
  delete: (id) => request.delete(`/comments/${id}`)
};

export const followApi = {
  toggle: (userId) => request.post(`/follows/${userId}`),
  getFollowers: (userId, params) => request.get(`/follows/followers/${userId}`, { params }),
  getFollowing: (userId, params) => request.get(`/follows/following/${userId}`, { params })
};

export const favoriteApi = {
  getList: (params) => request.get('/favorites', { params })
};

export const messageApi = {
  getList: (params) => request.get('/messages', { params }),
  getUnreadCount: () => request.get('/messages/unread-count'),
  markRead: (id) => request.post(`/messages/read/${id}`),
  markAllRead: (data) => request.post('/messages/read-all', data),
  delete: (id) => request.delete(`/messages/${id}`)
};

export const categoryApi = {
  getList: () => request.get('/categories')
};

export const activityApi = {
  getMyQuestions: (params) => request.get('/activity/questions', { params }),
  getMyAnswers: (params) => request.get('/activity/answers', { params }),
  getMyArticles: (params) => request.get('/activity/articles', { params })
};

export const adminApi = {
  getStats: () => request.get('/admin/stats'),
  getUsers: (params) => request.get('/admin/users', { params }),
  updateUserStatus: (id, status) => request.put(`/admin/users/${id}/status`, { status }),
  getReports: (params) => request.get('/admin/reports', { params }),
  updateReportStatus: (id, status) => request.put(`/admin/reports/${id}/status`, { status }),
  updateContentStatus: (targetType, targetId, status) => 
    request.put(`/admin/content/${targetType}/${targetId}/status`, { status }),
  setRecommendation: (targetType, targetId, data) => 
    request.put(`/admin/recommendations/${targetType}/${targetId}`, data)
};

export const searchApi = {
  search: (params) => request.get('/search', { params })
};

export const healthApi = {
  check: () => request.get('/health')
};
