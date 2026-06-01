import axios from 'axios'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:53406') + '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000
})

api.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err.response?.data?.error || err.message || '请求失败'
    return Promise.reject(new Error(msg))
  }
)

export default api