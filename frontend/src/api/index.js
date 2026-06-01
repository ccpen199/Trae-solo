import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => {
    if (response.data.success) {
      return response.data
    }
    if (!response.config.silent) {
      toast.error(response.data.message || '请求失败')
    }
    return Promise.reject(new Error(response.data.message || '请求失败'))
  },
  (error) => {
    if (!error.config?.silent) {
      if (error.code === 'ECONNABORTED') {
        toast.error('请求超时，请检查网络')
      } else if (error.response) {
        const { status } = error.response
        switch (status) {
          case 404:
            toast.error('资源不存在')
            break
          case 500:
            toast.error('服务器错误，请稍后重试')
            break
          default:
            toast.error(error.response.data?.message || '请求失败')
        }
      } else if (error.message) {
        toast.error(error.message)
      } else {
        toast.error('网络错误，请检查网络连接')
      }
    }
    return Promise.reject(error)
  }
)

export const chartsApi = {
  getList: () => api.get('/charts'),
  getDetail: (id) => api.get(`/charts/${id}`),
  create: (data) => api.post('/charts', data),
  update: (id, data) => api.put(`/charts/${id}`, data),
  updateSilent: (id, data) => api.put(`/charts/${id}`, data, { silent: true }),
  delete: (id) => api.delete(`/charts/${id}`),
  copy: (id) => api.post(`/charts/${id}/copy`),
}

export default api
