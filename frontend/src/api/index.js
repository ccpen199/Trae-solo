import axios from 'axios'
import { message } from 'antd'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

api.interceptors.response.use(
  response => {
    const { success, message: msg, data } = response.data
    if (!success) {
      message.error(msg || '请求失败')
      return Promise.reject(new Error(msg))
    }
    return data
  },
  error => {
    const { response } = error
    if (response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    } else if (response?.status === 403) {
      message.error('没有权限访问')
    } else if (response?.status === 404) {
      message.error('资源不存在')
    } else {
      message.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (account, password) => api.post('/auth/login', { account, password }),
  register: data => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: data => api.put('/auth/profile', data),
}

export const contentAPI = {
  getCategories: () => api.get('/content/categories'),
  getBanners: () => api.get('/content/banners'),
  getAlbums: params => api.get('/content/albums', { params }),
  getRecommendAlbums: params => api.get('/content/albums/recommend', { params }),
  getAlbumDetail: id => api.get(`/content/albums/${id}`),
  getEpisode: id => api.get(`/content/episodes/${id}`),
  toggleFavorite: id => api.post(`/content/albums/${id}/favorite`),
  toggleSubscribe: id => api.post(`/content/albums/${id}/subscribe`),
  getComments: (id, params) => api.get(`/content/albums/${id}/comments`, { params }),
  addComment: (id, content) => api.post(`/content/albums/${id}/comments`, { content }),
}

export const userAPI = {
  getFavorites: params => api.get('/user/favorites', { params }),
  getSubscribes: params => api.get('/user/subscribes', { params }),
  getHistory: params => api.get('/user/history', { params }),
  addHistory: data => api.post('/user/history', data),
  getFollows: () => api.get('/user/follows'),
  toggleFollow: id => api.post(`/user/follows/${id}`),
  getDailyTasks: () => api.get('/user/daily-tasks'),
  completeTask: type => api.post(`/user/daily-tasks/${type}/complete`),
}

export const liveAPI = {
  getRooms: params => api.get('/live/rooms', { params }),
  getRoom: id => api.get(`/live/rooms/${id}`),
  getRoomDetail: id => api.get(`/live/rooms/${id}`),
  getGifts: () => api.get('/live/gifts'),
  sendGift: (roomId, giftId, count) => api.post(`/live/rooms/${roomId}/gifts`, { gift_id: giftId, count }),
}

export default api
