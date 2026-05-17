import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  async (error) => {
    const originalRequest = error.config

    if (error.code === 'ECONNABORTED' && !originalRequest._retry) {
      originalRequest._retry = true
      return apiClient(originalRequest)
    }

    if (!originalRequest._retry && error.response?.status >= 500) {
      originalRequest._retry = true
      return apiClient(originalRequest)
    }

    return Promise.reject(error)
  }
)

export const coursesAPI = {
  getAll: (params) => apiClient.get('/courses', { params }),
  getById: (id) => apiClient.get(`/courses/${id}`),
  startSession: (data) => apiClient.post('/courses/session/start', data),
  updateSession: (data) => apiClient.post('/courses/session/update', data),
  endSession: (data) => apiClient.post('/courses/session/end', data),
  getSession: (id) => apiClient.get(`/courses/session/${id}`)
}

export const coachesAPI = {
  getAll: () => apiClient.get('/coaches'),
  getRehabilitation: () => apiClient.get('/coaches/rehabilitation'),
  follow: (id) => apiClient.post(`/coaches/${id}/follow`)
}

export const rankingsAPI = {
  getAll: (params) => apiClient.get('/rankings', { params }),
  getUserRanking: (userId, params) => apiClient.get(`/rankings/user/${userId}`, { params })
}

export const challengesAPI = {
  getAll: (params) => apiClient.get('/challenges', { params }),
  getById: (id) => apiClient.get(`/challenges/${id}`),
  join: (id, data) => apiClient.post(`/challenges/${id}/join`, data),
  updateProgress: (id, data) => apiClient.post(`/challenges/${id}/update-progress`, data),
  getUserChallenges: (userId) => apiClient.get(`/challenges/user/${userId}`)
}

export const usersAPI = {
  getAll: () => apiClient.get('/users'),
  getById: (id) => apiClient.get(`/users/${id}`),
  getStats: (id) => apiClient.get(`/users/${id}/stats`),
  recordExercise: (id, data) => apiClient.post(`/users/${id}/record`, data)
}

export default apiClient
