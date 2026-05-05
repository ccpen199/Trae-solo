import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: '/',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    const { data } = response
    if (data.code === 200 || data.status === 'ok') {
      return data
    }
    ElMessage.error(data.message || '请求失败')
    return Promise.reject(new Error(data.message || '请求失败'))
  },
  (error) => {
    const message = error.response?.data?.message || error.message || '网络错误'
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export const adminApi = {
  getSystemInfo: () => api.get('/api/admin/system-info'),
  
  getAccessConfig: () => api.get('/api/admin/access-config'),
  updateAccessConfig: (data) => api.put('/api/admin/access-config', data),
  
  getCollisionConfig: () => api.get('/api/admin/collision-config'),
  updateCollisionConfig: (data) => api.put('/api/admin/collision-config', data),
  
  getChannels: () => api.get('/api/admin/channels'),
  createChannel: (data) => api.post('/api/admin/channels', data),
  updateChannel: (id, data) => api.put(`/api/admin/channels/${id}`, data),
  deleteChannel: (id) => api.delete(`/api/admin/channels/${id}`),
  
  getProducts: () => api.get('/api/admin/products'),
  createProduct: (data) => api.post('/api/admin/products', data),
  
  getRecords: (params) => api.get('/api/admin/records', { params }),
  getRecordDetail: (id) => api.get(`/api/admin/records/${id}`),
  getStats: (params) => api.get('/api/admin/stats', { params }),
  
  getAlerts: () => api.get('/api/admin/alerts'),
  clearAlerts: () => api.post('/api/admin/alerts/clear'),
  
  getBlacklist: (params) => api.get('/api/admin/blacklist', { params }),
  addToBlacklist: (data) => api.post('/api/admin/blacklist', data),
  removeFromBlacklist: (id) => api.delete(`/api/admin/blacklist/${id}`)
}

export const collisionApi = {
  validateAccess: (data) => api.post('/api/collision/test/access', data),
  processCollision: (data) => api.post('/api/collision/test/collision', data),
  jointRegister: (data) => api.post('/api/collision/test/register', data),
  fullProcess: (data) => api.post('/api/collision/test/full-process', data),
  getSignatureExample: () => api.get('/api/collision/signature-example'),
  generateMd5: (text) => api.post('/api/collision/md5', { text })
}

export const healthApi = {
  check: () => api.get('/health')
}

export default api
