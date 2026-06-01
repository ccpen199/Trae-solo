import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:58886/api',
  timeout: 10000
})

export const getStats = () => api.get('/dashboard/stats')
export const getOverdueProjects = () => api.get('/dashboard/overdue-projects')
export const getProjects = () => api.get('/projects')
export const getProject = (id) => api.get(`/projects/${id}`)
export const createProject = (data) => api.post('/projects', data)
export const updateProject = (id, data) => api.put(`/projects/${id}`, data)
export const getProjectBudget = (projectId) => api.get(`/projects/${projectId}/budget`)
export const adjustBudget = (data) => api.post('/budget/adjust', data)
export const getBudgetAdjustments = (params) => api.get('/budget/adjustments', { params })
export const approveBudgetAdjust = (id, data) => api.put(`/budget/adjustments/${id}/approve`, data)
export const getContracts = (params) => api.get('/contracts', { params })
export const createContract = (data) => api.post('/contracts', data)
export const getReimbursements = (params) => api.get('/reimbursements', { params })
export const createReimbursement = (data) => api.post('/reimbursements', data)
export const approveReimbursement = (id, data) => api.put(`/reimbursements/${id}/approve`, data)
export const getPurchases = (params) => api.get('/purchases', { params })
export const createPurchase = (data) => api.post('/purchases', data)
export const approvePurchase = (id, data) => api.put(`/purchases/${id}/approve`, data)
export const getFundReceipts = (params) => api.get('/fund-receipts', { params })
export const createFundReceipt = (data) => api.post('/fund-receipts', data)
export const getCompletions = () => api.get('/project-completions')
export const createCompletion = (data) => api.post('/project-completions', data)
export const approveCompletion = (id, data) => api.put(`/project-completions/${id}/approve`, data)

export const uploadFile = (file, data) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('business_type', data.business_type)
  formData.append('business_id', data.business_id)
  formData.append('uploader', data.uploader)
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
export const getAttachments = (params) => api.get('/attachments', { params })
export const deleteAttachment = (id) => api.delete(`/attachments/${id}`)

export default api
