import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  response => {
    const { data } = response
    if (data.code === 200) {
      return data
    } else {
      ElMessage.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }
  },
  error => {
    const { response } = error
    if (response) {
      switch (response.status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          break
        case 403:
          ElMessage.error('无权限访问')
          break
        case 404:
          ElMessage.error('接口不存在')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error(response.data?.message || '请求失败')
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

const api = {
  auth: {
    login: (data) => request.post('/auth/login', data),
    logout: () => request.post('/auth/logout'),
    getCurrentUser: () => request.get('/auth/me')
  },
  
  user: {
    getList: (params) => request.get('/users', { params }),
    getById: (id) => request.get(`/users/${id}`),
    create: (data) => request.post('/users', data),
    update: (id, data) => request.put(`/users/${id}`, data),
    resetPassword: (id, data) => request.post(`/users/${id}/reset-password`, data),
    delete: (id) => request.delete(`/users/${id}`),
    getRoles: () => request.get('/users/roles')
  },
  
  table: {
    getList: (params) => request.get('/tables', { params }),
    getById: (id) => request.get(`/tables/${id}`),
    create: (data) => request.post('/tables', data),
    update: (id, data) => request.put(`/tables/${id}`, data),
    updateStatus: (id, data) => request.patch(`/tables/${id}/status`, data),
    delete: (id) => request.delete(`/tables/${id}`),
    getAreas: () => request.get('/tables/areas')
  },
  
  dish: {
    getList: (params) => request.get('/dishes', { params }),
    getById: (id) => request.get(`/dishes/${id}`),
    create: (data) => request.post('/dishes', data),
    update: (id, data) => request.put(`/dishes/${id}`, data),
    updateStatus: (id, data) => request.patch(`/dishes/${id}/status`, data),
    delete: (id) => request.delete(`/dishes/${id}`),
    getMenu: (params) => request.get('/dishes/menu', { params }),
    
    categories: {
      getList: (params) => request.get('/dishes/categories', { params }),
      create: (data) => request.post('/dishes/categories', data),
      update: (id, data) => request.put(`/dishes/categories/${id}`, data),
      delete: (id) => request.delete(`/dishes/categories/${id}`)
    }
  },
  
  order: {
    getList: (params) => request.get('/orders', { params }),
    getById: (id) => request.get(`/orders/${id}`),
    create: (data) => request.post('/orders', data),
    updateItems: (id, data) => request.put(`/orders/${id}/items`, data),
    updateStatus: (id, data) => request.patch(`/orders/${id}/status`, data),
    getStatistics: (params) => request.get('/orders/statistics', { params })
  },
  
  payment: {
    getList: (params) => request.get('/payments', { params }),
    getById: (id) => request.get(`/payments/${id}`),
    create: (data) => request.post('/payments', data),
    getStatistics: (params) => request.get('/payments/statistics', { params })
  },
  
  inventory: {
    getList: (params) => request.get('/inventories', { params }),
    getById: (id) => request.get(`/inventories/${id}`),
    create: (data) => request.post('/inventories', data),
    update: (id, data) => request.put(`/inventories/${id}`, data),
    adjust: (id, data) => request.post(`/inventories/${id}/adjust`, data),
    delete: (id) => request.delete(`/inventories/${id}`),
    getLowStock: () => request.get('/inventories/low-stock'),
    getLogs: (params) => request.get('/inventories/logs', { params })
  }
}

export default api
