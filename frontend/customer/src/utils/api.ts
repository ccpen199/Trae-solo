import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { showToast } from 'vant'

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: '/api',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response
    },
    (error) => {
      const { response } = error

      if (response) {
        const message = response.data?.message || '请求失败'
        showToast({ message, type: 'fail' })
      } else if (error.message === 'Network Error') {
        showToast({ message: '网络错误，请检查网络连接', type: 'fail' })
      } else {
        showToast({ message: '请求失败，请稍后重试', type: 'fail' })
      }

      return Promise.reject(error)
    }
  )

  return client
}

const api = createApiClient()

export const request = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.get(url, config).then((res) => res.data),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    api.post(url, data, config).then((res) => res.data),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    api.put(url, data, config).then((res) => res.data),

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.delete(url, config).then((res) => res.data),
}

export default api
