import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'

interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    console.log('[HTTP Request]', config.method?.toUpperCase(), config.baseURL + config.url)
    return config
  },
  (error) => {
    console.error('[HTTP Request Error]', error)
    ElMessage.error('请求发送失败: ' + (error.message || '未知错误'))
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    console.log('[HTTP Response]', response.config.url, 'code:', res.code, 'message:', res.message)
    if (res.code !== 200) {
      const errMsg = res.message || '请求失败'
      console.error('[HTTP Response Error]', errMsg)
      ElMessage.error(errMsg)
      if (res.code === 401) {
        const userStore = useUserStore()
        userStore.logout()
        router.push('/login')
      }
      return Promise.reject(new Error(errMsg))
    }
    return response
  },
  (error) => {
    console.error('[HTTP Network Error]', error.message, error.config?.url)
    let errMsg = '网络连接失败'
    if (error.code === 'ECONNABORTED') {
      errMsg = '请求超时，请稍后重试'
    } else if (error.response) {
      const status = error.response.status
      if (status === 401) {
        errMsg = '登录已过期，请重新登录'
        const userStore = useUserStore()
        userStore.logout()
        router.push('/login')
      } else if (status === 403) {
        errMsg = '没有权限访问'
      } else if (status === 404) {
        errMsg = '请求的接口不存在'
      } else if (status >= 500) {
        errMsg = '服务器内部错误'
      } else {
        errMsg = error.response?.data?.message || '请求失败'
      }
    } else if (error.message === 'Network Error') {
      errMsg = '网络连接失败，请检查网络'
    }
    ElMessage.error(errMsg)
    const enhancedError = new Error(errMsg)
    ;(enhancedError as any).response = error.response
    return Promise.reject(enhancedError)
  }
)

export function get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return service.get(url, { params, ...config }).then(res => res.data)
}

export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return service.post(url, data, config).then(res => res.data)
}

export function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return service.put(url, data, config).then(res => res.data)
}

export function del<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return service.delete(url, { params, ...config }).then(res => res.data)
}

export default service
