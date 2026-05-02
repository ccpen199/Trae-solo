import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const userApi = {
  login: (data) => api.post('/users/login', data),
  register: (data) => api.post('/users/register', data),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getStudents: () => api.get('/users/students')
}

export const gameApi = {
  getTypes: (category) => api.get('/games/types', { params: { category } }),
  getType: (code) => api.get(`/games/types/${code}`),
  getLevel: (id) => api.get(`/games/levels/${id}`),
  getQuizQuestions: (params) => api.get('/games/quiz/questions', { params }),
  checkQuizAnswers: (data) => api.post('/games/quiz/check', data)
}

export const rankingApi = {
  getGlobal: (params) => api.get('/ranking/global', { params }),
  getMyRank: (params) => api.get('/ranking/my-rank', { params }),
  getHistory: (params) => api.get('/ranking/history', { params }),
  getStats: () => api.get('/ranking/stats')
}

export const roomApi = {
  create: (data) => api.post('/rooms/create', data),
  join: (roomCode) => api.post(`/rooms/join/${roomCode}`),
  get: (roomCode) => api.get(`/rooms/${roomCode}`),
  ready: (data) => api.post('/rooms/ready', data),
  start: (data) => api.post('/rooms/start', data),
  leave: (data) => api.post('/rooms/leave', data),
  getWaitingList: () => api.get('/rooms/list/waiting')
}

export default api
