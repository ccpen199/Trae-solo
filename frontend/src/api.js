import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    ElMessage.error(err.response?.data?.error || err.message || '请求失败')
    return Promise.reject(err)
  }
)

export default api

export const topicsApi = {
  list: (params) => api.get('/topics', { params }),
  detail: (id) => api.get(`/topics/${id}`),
  create: (data) => api.post('/topics', data),
  update: (id, data) => api.put(`/topics/${id}`, data),
  merge: (id, data) => api.post(`/topics/${id}/merge`, data),
  checkSimilar: (params) => api.get('/topics/check-similar', { params }),
  submitAudit: (id, data) => api.post(`/topics/${id}/submit-audit`, data)
}

export const postsApi = {
  list: (params) => api.get('/posts', { params }),
  detail: (id) => api.get(`/posts/${id}`),
  create: (data) => api.post('/posts', data),
  updateTags: (id, data) => api.post(`/posts/${id}/tags`, data),
  batchTags: (id, data) => api.post(`/posts/${id}/tags/batch`, data),
  suggestions: (id) => api.get(`/posts/${id}/tag-suggestions`)
}

export const moderationApi = {
  list: (params) => api.get('/moderation', { params }),
  handle: (id, data) => api.post(`/moderation/${id}/handle`, data),
  create: (data) => api.post('/moderation', data)
}

export const dashboardApi = {
  overview: () => api.get('/dashboard/overview'),
  trend: (params) => api.get('/dashboard/topic-trend', { params })
}

export const tagChangesApi = {
  list: (params) => api.get('/tag-changes', { params })
}

export const categoriesApi = {
  list: () => api.get('/categories')
}
