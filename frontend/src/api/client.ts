import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success === false) {
      const errorMessage = response.data.error?.message || response.data.message || '请求失败'
      const error = new Error(errorMessage) as any
      error.response = {
        ...response,
        data: {
          ...response.data,
          error: response.data.error || { message: errorMessage },
        },
      }
      return Promise.reject(error)
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
