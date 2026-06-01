import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const pointsApi = {
  list: (params) => request.get('/points', { params }),
  get: (id) => request.get(`/points/${id}`),
  create: (data) => request.post('/points', data),
  update: (id, data) => request.put(`/points/${id}`, data),
  delete: (id) => request.delete(`/points/${id}`)
}

export const dataApi = {
  list: (params) => request.get('/data', { params }),
  latest: (params) => request.get('/data/latest', { params }),
  trend: (params) => request.get('/data/trend', { params }),
  create: (data) => request.post('/data', data)
}

export const alertsApi = {
  list: (params) => request.get('/alerts', { params }),
  get: (id) => request.get(`/alerts/${id}`),
  updateStatus: (id, status) => request.put(`/alerts/${id}/status`, { status })
}

export const tasksApi = {
  list: (params) => request.get('/tasks', { params }),
  get: (id) => request.get(`/tasks/${id}`),
  create: (data) => request.post('/tasks', data),
  update: (id, data) => request.put(`/tasks/${id}`, data),
  upload: (id, file) => {
    const formData = new FormData()
    formData.append('photo', file)
    return request.post(`/tasks/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  review: (id, data) => request.post(`/tasks/${id}/review`, data)
}

export const reportsApi = {
  summary: (params) => request.get('/reports/summary', { params }),
  byPoint: (params) => request.get('/reports/by-point', { params }),
  byAlert: (params) => request.get('/reports/by-alert', { params }),
  export: (params) => {
    const url = `/api/reports/export?${new URLSearchParams(params).toString()}`
    const link = document.createElement('a')
    link.href = url
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },
  acceptanceCheck: () => request.get('/reports/acceptance-check')
}

export default request
