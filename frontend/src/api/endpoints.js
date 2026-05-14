import api from './index'

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data)
}

export const topicAPI = {
  getAll: () => api.get('/topics')
}

export const questionAPI = {
  getList: (params) => api.get('/questions', { params }),
  getById: (id) => api.get(`/questions/${id}`),
  create: (data) => api.post('/questions', data),
  saveDraft: (data) => api.post('/questions/draft', data),
  getDraft: () => api.get('/questions/draft'),
  clearDraft: () => api.delete('/questions/draft'),
  follow: (id) => api.post(`/questions/${id}/follow`),
  like: (id) => api.post(`/questions/${id}/like`)
}

export const articleAPI = {
  getList: (params) => api.get('/articles', { params }),
  getById: (id) => api.get(`/articles/${id}`),
  create: (data) => api.post('/articles', data),
  like: (id) => api.post(`/articles/${id}/like`),
  favorite: (id) => api.post(`/articles/${id}/favorite`)
}

export const answerAPI = {
  create: (data) => api.post('/answers', data),
  like: (id) => api.post(`/answers/${id}/like`)
}

export const commentAPI = {
  create: (data) => api.post('/comments', data),
  like: (id) => api.post(`/comments/${id}/like`)
}

export const userAPI = {
  getProfile: (id) => api.get(`/users/${id}`),
  followUser: (id) => api.get(`/users/${id}/follow`),
  getMyQuestions: (params) => api.get('/users/me/questions', { params }),
  getMyAnswers: (params) => api.get('/users/me/answers', { params }),
  getMyArticles: (params) => api.get('/users/me/articles', { params }),
  getMyFavorites: (params) => api.get('/users/me/favorites', { params }),
  getMyFollowings: () => api.get('/users/me/followings'),
  getMyFollowers: () => api.get('/users/me/followers')
}

export const notificationAPI = {
  getList: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.post(`/notifications/${id}/read`)
}

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, data) => api.put(`/admin/users/${id}/role`, data),
  toggleUserStatus: (id) => api.post(`/admin/users/${id}/toggle-status`),
  getContent: (params) => api.get('/admin/content', { params }),
  updateContentStatus: (type, id, data) => api.put(`/admin/content/${type}/${id}/status`, data),
  deleteContent: (type, id) => api.delete(`/admin/content/${type}/${id}`)
}
