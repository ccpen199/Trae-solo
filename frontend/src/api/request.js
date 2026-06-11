import axios from 'axios'
import { message } from 'antd'
import { getCache, setCache } from '../utils/offlineCache.js'
import { isWeakNetwork, isOnline } from '../utils/networkDetection.js'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

const request = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

const notifyApiError = (key, content) => {
  message.error({ key, content, duration: 2 })
}

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    const userId = localStorage.getItem('userId') || '1'
    config.headers['X-User-Id'] = userId
    if (isWeakNetwork()) {
      config.headers['X-Network-Status'] = 'weak'
    }
    if (config.method === 'get' && isWeakNetwork()) {
      const cacheKey = `${config.url}_${JSON.stringify(config.params)}`
      const cached = getCache(cacheKey)
      if (cached) {
        config.adapter = () => Promise.resolve({
          data: cached,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          request: {}
        })
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => {
    if (response.config.method === 'get') {
      const cacheKey = `${response.config.url}_${JSON.stringify(response.config.params)}`
      setCache(cacheKey, response.data)
    }
    return response.data
  },
  (error) => {
    if (!isOnline() && error.config.method === 'get') {
      const cacheKey = `${error.config.url}_${JSON.stringify(error.config.params)}`
      const cached = getCache(cacheKey)
      if (cached) {
        message.warning('当前网络不可用，使用本地缓存数据')
        return cached
      }
    }
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      notifyApiError('api-timeout', '请求超时，请检查后端服务')
    } else if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        notifyApiError('api-auth', '登录已过期，请重新登录')
        localStorage.removeItem('token')
      } else if (status === 403) {
        notifyApiError('api-forbidden', '没有权限访问')
      } else if (status >= 500) {
        notifyApiError('api-server', '服务器错误，请稍后重试')
      } else if (data?.message) {
        notifyApiError(`api-${status}`, data.message)
      }
    } else if (error.message) {
      notifyApiError('api-network', '接口连接失败，请检查后端服务')
    }
    return Promise.reject(error)
  }
)

export default request
