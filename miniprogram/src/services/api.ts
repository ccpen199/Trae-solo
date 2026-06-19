import Taro from '@tarojs/taro'

const BASE_URL = process.env.TARO_APP_API_BASE_URL || 'http://localhost:3000'

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  loading?: boolean
}

export const request = async <T = any>(options: RequestOptions): Promise<ApiResponse<T>> => {
  const { url, method = 'GET', data, header = {}, loading = true } = options

  if (loading) {
    Taro.showLoading({ title: '加载中...', mask: true })
  }

  try {
    const token = Taro.getStorageSync('token')
    const requestHeader = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...header
    }

    const res = await Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: requestHeader,
      timeout: 30000
    })

    if (loading) {
      Taro.hideLoading()
    }

    const result = res.data as ApiResponse<T>

    if (result.code === 401) {
      Taro.removeStorageSync('token')
      Taro.showToast({ title: '请先登录', icon: 'none' })
      throw new Error('未授权')
    }

    if (result.code !== 0 && result.code !== 200) {
      Taro.showToast({ title: result.message || '请求失败', icon: 'none' })
      throw new Error(result.message || '请求失败')
    }

    return result
  } catch (error: any) {
    if (loading) {
      Taro.hideLoading()
    }
    if (error.errMsg) {
      Taro.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
    }
    throw error
  }
}

export const get = <T = any>(url: string, data?: any, loading = true) =>
  request<T>({ url, method: 'GET', data, loading })

export const post = <T = any>(url: string, data?: any, loading = true) =>
  request<T>({ url, method: 'POST', data, loading })

export const put = <T = any>(url: string, data?: any, loading = true) =>
  request<T>({ url, method: 'PUT', data, loading })

export const del = <T = any>(url: string, data?: any, loading = true) =>
  request<T>({ url, method: 'DELETE', data, loading })
