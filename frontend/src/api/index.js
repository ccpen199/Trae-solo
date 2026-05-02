import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
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
  error => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          ElMessage.error('登录已过期，请重新登录')
          router.push('/login')
          break
        case 403:
          ElMessage.error('无权限执行此操作')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error(error.response.data?.error || '服务器内部错误')
          break
        default:
          ElMessage.error(error.response.data?.error || '请求失败')
      }
    } else {
      ElMessage.error('网络连接失败')
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
}

export const orderApi = {
  list: (params) => api.get('/orders', { params }),
  get: (mainOrderNo) => api.get(`/orders/${mainOrderNo}`),
  create: (data) => api.post('/orders', data),
  action: (mainOrderNo, data) => api.post(`/orders/${mainOrderNo}/action`, data),
  getTimeline: (mainOrderNo) => api.get(`/orders/${mainOrderNo}/timeline`),
  getLogs: (mainOrderNo) => api.get(`/orders/${mainOrderNo}/logs`)
}

export const arrivalApi = {
  predict: (mainOrderNo) => api.get(`/arrival/predict/${mainOrderNo}`),
  confirm: (mainOrderNo, data) => api.post(`/arrival/confirm/${mainOrderNo}`, data),
  getHistory: (mainOrderNo) => api.get(`/arrival/history/${mainOrderNo}`)
}

export const exceptionApi = {
  list: (params) => api.get('/exception', { params }),
  get: (queueId) => api.get(`/exception/${queueId}`),
  create: (data) => api.post('/exception/create', data),
  handle: (queueId, data) => api.post(`/exception/${queueId}/handle`, data)
}

export const statisticsApi = {
  getDashboard: (params) => api.get('/statistics/dashboard', { params }),
  finalize: (mainOrderNo, data) => api.post(`/statistics/finalize/${mainOrderNo}`, data),
  export: (params) => api.get('/statistics/export', { params, responseType: 'blob' })
}

export const mapApi = {
  getVehicles: (params) => api.get('/map/vehicles', { params }),
  submitTrack: (data) => api.post('/map/track', data),
  getTracks: (vehicleId, params) => api.get(`/map/tracks/${vehicleId}`, { params }),
  getStations: (params) => api.get('/map/stations', { params }),
  getRoutes: () => api.get('/map/routes'),
  getDrivers: () => api.get('/map/drivers')
}

export const alarmApi = {
  list: (params) => api.get('/alarms', { params }),
  get: (alarmId) => api.get(`/alarms/${alarmId}`),
  handle: (alarmId, data) => api.post(`/alarms/${alarmId}/handle`, data),
  getOverview: () => api.get('/alarms/stats/overview')
}

export default api
