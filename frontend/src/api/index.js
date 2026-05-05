import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
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
  (response) => {
    const { data } = response
    if (data.success) {
      return data
    } else {
      ElMessage.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          ElMessage.error('登录已过期，请重新登录')
          break
        case 403:
          ElMessage.error('无权限访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error(error.response.data?.message || '请求失败')
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (oldPassword, newPassword) => 
    api.post('/auth/change-password', null, { params: { oldPassword, newPassword } }),
  resetPassword: (email, newPassword) => 
    api.post('/auth/reset-password', null, { params: { email, newPassword } })
}

export const cardApi = {
  list: (params) => api.get('/cards', { params }),
  get: (id) => api.get(`/cards/${id}`),
  create: (data) => api.post('/cards', data),
  update: (id, data) => api.put(`/cards/${id}`, data),
  delete: (id) => api.delete(`/cards/${id}`),
  batchDelete: (ids) => api.delete('/cards/batch', { data: ids }),
  mergeToContact: (cardId, contactId) => api.post(`/cards/${cardId}/merge/${contactId}`),
  getByContact: (contactId) => api.get(`/cards/contact/${contactId}`),
  getCompanies: () => api.get('/cards/companies'),
  getDepartments: () => api.get('/cards/departments')
}

export const groupApi = {
  list: () => api.get('/groups'),
  get: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post('/groups', data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
  getCards: (groupId, params) => api.get(`/groups/${groupId}/cards`, { params }),
  addCard: (groupId, cardId) => api.post(`/groups/${groupId}/cards/${cardId}`),
  removeCard: (groupId, cardId) => api.delete(`/groups/${groupId}/cards/${cardId}`)
}

export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  getUser: (id) => api.get(`/admin/users/${id}`),
  approveUser: (id) => api.put(`/admin/users/${id}/approve`),
  rejectUser: (id, reason) => api.put(`/admin/users/${id}/reject`, null, { params: { reason } }),
  disableUser: (id) => api.put(`/admin/users/${id}/disable`),
  enableUser: (id) => api.put(`/admin/users/${id}/enable`),
  updateRole: (id, role) => api.put(`/admin/users/${id}/role`, null, { params: { role } }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`)
}

export default api
