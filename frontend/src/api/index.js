import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('API Error:', error)
    ElMessage.error(error.message || '请求失败')
    return Promise.reject(error)
  }
)

export const departmentApi = {
  list: () => api.get('/departments'),
  get: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`)
}

export const employeeApi = {
  list: (params) => api.get('/employees', { params }),
  get: (id) => api.get(`/employees/${id}`),
  getDetails: (id) => api.get(`/employees/${id}/details`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  updateStatus: (id, data) => api.put(`/employees/${id}/status`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  addEducation: (id, data) => api.post(`/employees/${id}/education`, data),
  addFamily: (id, data) => api.post(`/employees/${id}/family`, data),
  addWorkExperience: (id, data) => api.post(`/employees/${id}/work-experience`, data),
  addProjectExperience: (id, data) => api.post(`/employees/${id}/project-experience`, data),
  addTraining: (id, data) => api.post(`/employees/${id}/training`, data),
  updateDetail: (type, id, data) => api.put(`/employees/detail/${type}/${id}`, data),
  deleteDetail: (type, id) => api.delete(`/employees/detail/${type}/${id}`)
}

export default api
