import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('deppon_api_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data.code && data.code !== 200 && data.code !== 201) {
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    return data
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      const message = data?.message || `请求错误 (${status})`
      return Promise.reject(new Error(message))
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('请求超时，请稍后重试'))
    }
    return Promise.reject(new Error('网络连接失败，请检查后端服务是否启动'))
  }
)

export default apiClient

export const orderApi = {
  create: (data: any) => apiClient.post('/orders', data),
  getByWaybillNo: (waybillNo: string) => apiClient.get(`/orders/${waybillNo}`),
  list: () => apiClient.get('/orders')
}

export const trackingApi = {
  getMonitorData: (waybillNo: string, params?: { startTime?: string; endTime?: string }) =>
    apiClient.get(`/tracking/${waybillNo}/monitor`, { params }),
  acknowledgeAlert: (waybillNo: string, alertId: string, acknowledgedBy?: string) =>
    apiClient.post(`/tracking/${waybillNo}/alerts/${alertId}/acknowledge`, { acknowledgedBy })
}

export const packagingApi = {
  getOptions: () => apiClient.get('/packaging/options'),
  calculateQuote: (data: any) => apiClient.post('/packaging/quote', data)
}

export const claimsApi = {
  create: (data: any) => apiClient.post('/claims', data),
  getById: (claimId: string) => apiClient.get(`/claims/${claimId}`),
  approve: (claimId: string, data: any) => apiClient.put(`/claims/${claimId}/approve`, data),
  reject: (claimId: string, data: any) => apiClient.put(`/claims/${claimId}/reject`, data)
}

export const vehicleApi = {
  list: (params?: { status?: string }) => apiClient.get('/vehicles', { params }),
  getByPlateNo: (plateNo: string) => apiClient.get(`/vehicles/${plateNo}`),
  getPlatformStatus: () => apiClient.get('/vehicles/platform-status')
}

export const enterpriseApi = {
  apply: (data: any) => apiClient.post('/enterprise/apply', data),
  getToken: (clientId: string, clientSecret: string) =>
    apiClient.post('/enterprise/token', { clientId, clientSecret }),
  getEndpoints: () => apiClient.get('/enterprise/endpoints')
}

export const healthApi = {
  check: () => apiClient.get('/health')
}
