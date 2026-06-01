import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

export const repositoriesApi = {
  list: () => api.get('/repositories'),
  get: (id: number) => api.get(`/repositories/${id}`),
  create: (data: any) => api.post('/repositories', data),
  remove: (id: number) => api.delete(`/repositories/${id}`),
}

export const namespacesApi = {
  list: (repoId: number) => api.get(`/repositories/${repoId}/namespaces`),
  create: (repoId: number, data: any) => api.post(`/repositories/${repoId}/namespaces`, data),
}

export const artifactsApi = {
  list: (params?: any) => api.get('/artifacts', { params }),
  get: (id: number) => api.get(`/artifacts/${id}`),
}

export const versionsApi = {
  list: (artifactId: number) => api.get(`/artifacts/${artifactId}/versions`),
  get: (id: number) => api.get(`/versions/${id}`),
  promote: (id: number, data: any) => api.post(`/versions/${id}/promote`, data),
  download: (id: number, data?: any) => api.post(`/versions/${id}/download`, data || {}),
}

export const uploadApi = {
  validate: (data: any) => api.post('/upload/validate', data),
  upload: (data: any) => api.post('/upload', data),
}

export const permissionsApi = {
  list: (repoId?: number) => api.get('/permissions', { params: repoId ? { repoId } : {} }),
  create: (data: any) => api.post('/permissions', data),
  remove: (id: number) => api.delete(`/permissions/${id}`),
}

export const tokensApi = {
  list: () => api.get('/tokens'),
  create: (data: any) => api.post('/tokens', data),
  remove: (id: number) => api.delete(`/tokens/${id}`),
}

export const usersApi = {
  list: () => api.get('/users'),
}

export const auditApi = {
  list: (params?: any) => api.get('/audit-logs', { params }),
}

export const retentionApi = {
  list: () => api.get('/retention-policies'),
  create: (data: any) => api.post('/retention-policies', data),
  toggle: (id: number) => api.post(`/retention-policies/${id}/toggle`),
  remove: (id: number) => api.delete(`/retention-policies/${id}`),
  execute: (policyId: number) => api.post('/cleanup/execute', { policyId }),
}

export const alertsApi = {
  list: () => api.get('/alerts'),
  resolve: (id: number) => api.post(`/alerts/${id}/resolve`),
}

export const statsApi = {
  overview: () => api.get('/stats/overview'),
}

export default api