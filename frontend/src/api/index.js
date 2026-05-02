import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const instance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

instance.interceptors.request.use(
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

instance.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      
      if (status === 401) {
        localStorage.removeItem('token')
        router.push('/login')
        ElMessage.error('登录已过期，请重新登录')
      } else if (status === 403) {
        ElMessage.error(data.error || '权限不足')
      } else if (status === 404) {
        ElMessage.error(data.error || '资源不存在')
      } else if (status === 400) {
        ElMessage.error(data.error || '请求参数错误')
      } else if (status === 500) {
        ElMessage.error(data.error || '服务器内部错误')
      }
    } else {
      ElMessage.error('网络连接失败')
    }
    
    return Promise.reject(error)
  }
)

export default instance

import request from './index'

export const authApi = {
  login: (data) => request.post('/auth/login', data),
  register: (data) => request.post('/auth/register', data),
  getCurrentUser: () => request.get('/auth/me')
}

export const housesApi = {
  getList: (params) => request.get('/houses', { params }),
  getDetail: (id) => request.get(`/houses/${id}`),
  create: (data) => request.post('/houses', data),
  update: (id, data) => request.put(`/houses/${id}`, data),
  delete: (id) => request.delete(`/houses/${id}`)
}

export const sessionsApi = {
  getList: (params) => request.get('/sessions', { params }),
  getDetail: (id) => request.get(`/sessions/${id}`),
  create: (data) => request.post('/sessions', data),
  enter3dSpace: (id, data) => request.post(`/sessions/${id}/enter-3d-space`, data),
  viewHotspot: (id, data) => request.post(`/sessions/${id}/view-hotspot`, data),
  consultation: (id, data) => request.post(`/sessions/${id}/consultation`, data),
  captureLead: (id, data) => request.post(`/sessions/${id}/capture-lead`, data),
  cancel: (id, data) => request.post(`/sessions/${id}/cancel`, data)
}

export const messagesApi = {
  getList: (params) => request.get('/messages', { params }),
  markAsRead: (id) => request.put(`/messages/${id}/read`),
  markAllAsRead: () => request.put('/messages/read-all')
}
