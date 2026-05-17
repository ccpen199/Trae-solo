import request from './request'

export const authApi = {
  register: (data) => request.post('/auth/register', data),
  login: (data) => request.post('/auth/login', data),
  getProfile: () => request.get('/auth/profile')
}

export const courseApi = {
  getList: (params) => request.get('/courses', { params }),
  getDetail: (id) => request.get(`/courses/${id}`),
  getHomeData: () => request.get('/courses/home'),
  updateProgress: (data) => request.post('/courses/progress', data)
}

export const workoutApi = {
  create: (data) => request.post('/workouts', data),
  getList: (params) => request.get('/workouts', { params }),
  getStats: () => request.get('/workouts/stats')
}

export const searchApi = {
  search: (params) => request.get('/search', { params }),
  getHistory: () => request.get('/search/history'),
  clearHistory: () => request.delete('/search/history')
}
