import axios from 'axios'

const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:9861/api'

const api = axios.create({
  baseURL: API_BASE_URL
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = token
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login(data) {
    return api.post('/auth/login', data)
  },
  register(data) {
    return api.post('/auth/register', data)
  },
  getUser() {
    return api.get('/user')
  }
}

export const activityAPI = {
  getActivities(params) {
    return api.get('/activities', { params })
  },
  getActivity(id) {
    return api.get(`/activities/${id}`)
  },
  toggleFavorite(id) {
    return api.post(`/activities/${id}/favorite`)
  },
  addReview(id, data) {
    return api.post(`/activities/${id}/review`, data)
  },
  getActivityTypes() {
    return api.get('/activity_types')
  },
  getCities() {
    return api.get('/cities')
  },
  getFavorites() {
    return api.get('/user/favorites')
  }
}

export default api