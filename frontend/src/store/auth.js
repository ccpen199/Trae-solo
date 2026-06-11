import { defineStore } from 'pinia'
import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('jxrs_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('jxrs_token')
      localStorage.removeItem('jxrs_user')
      window.location.hash = '#/login'
    }
    return Promise.reject(err)
  }
)

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('jxrs_token') || '',
    user: JSON.parse(localStorage.getItem('jxrs_user') || 'null'),
    userType: localStorage.getItem('jxrs_type') || 'personal',
    enterprise: JSON.parse(localStorage.getItem('jxrs_enterprise') || 'null')
  }),
  actions: {
    async loginGanfutong(payload) {
      const res = await api.post('/auth/ganfutong/login', payload)
      this.token = res.data.data.token
      this.user = res.data.data.user
      this.userType = 'personal'
      localStorage.setItem('jxrs_token', this.token)
      localStorage.setItem('jxrs_user', JSON.stringify(this.user))
      localStorage.setItem('jxrs_type', 'personal')
      return res.data
    },
    async loginEnterprise(payload) {
      const res = await api.post('/auth/enterprise/login', payload)
      this.token = res.data.data.token
      this.user = res.data.data.user
      this.enterprise = res.data.data.enterprise
      this.userType = 'enterprise'
      localStorage.setItem('jxrs_token', this.token)
      localStorage.setItem('jxrs_user', JSON.stringify(this.user))
      localStorage.setItem('jxrs_enterprise', JSON.stringify(this.enterprise))
      localStorage.setItem('jxrs_type', 'enterprise')
      return res.data
    },
    async loginAdmin(payload) {
      const res = await api.post('/auth/admin/login', payload)
      this.token = res.data.data.token
      this.user = res.data.data.admin
      this.userType = 'admin'
      localStorage.setItem('jxrs_token', this.token)
      localStorage.setItem('jxrs_user', JSON.stringify(this.user))
      localStorage.setItem('jxrs_type', 'admin')
      return res.data
    },
    logout() {
      this.token = ''
      this.user = null
      this.enterprise = null
      this.userType = 'personal'
      localStorage.removeItem('jxrs_token')
      localStorage.removeItem('jxrs_user')
      localStorage.removeItem('jxrs_enterprise')
      localStorage.removeItem('jxrs_type')
    }
  }
})

export default api
