import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const dashboardApi = {
  getStatistics: () => api.get('/dashboard/statistics'),
  getRecentActivities: () => api.get('/dashboard/recent-activities'),
  getSettlementTrend: () => api.get('/dashboard/charts/settlement-trend'),
  getInsuranceTypes: () => api.get('/dashboard/charts/insurance-types'),
  getSettlementTypes: () => api.get('/dashboard/charts/settlement-types')
}

export const insuredApi = {
  getList: (params) => api.get('/insured', { params }),
  getDetail: (id) => api.get(`/insured/${id}`),
  create: (data) => api.post('/insured', data),
  update: (id, data) => api.put(`/insured/${id}`, data),
  delete: (id) => api.delete(`/insured/${id}`),
  getStatistics: (id) => api.get(`/insured/${id}/statistics`)
}

export const credentialApi = {
  getList: (params) => api.get('/credentials', { params }),
  getDetail: (id) => api.get(`/credentials/${id}`),
  create: (data) => api.post('/credentials', data),
  updateStatus: (id, status) => api.put(`/credentials/${id}/status`, { status }),
  useCredential: (id) => api.post(`/credentials/${id}/use`)
}

export const prescriptionApi = {
  getList: (params) => api.get('/prescriptions', { params }),
  getDetail: (id) => api.get(`/prescriptions/${id}`),
  create: (data) => api.post('/prescriptions', data),
  audit: (id, status) => api.put(`/prescriptions/${id}/audit`, { status }),
  transfer: (id) => api.put(`/prescriptions/${id}/transfer`),
  verify: (id, pharmacy_id) => api.post(`/prescriptions/${id}/verify`, { pharmacy_id })
}

export const offsiteApi = {
  getList: (params) => api.get('/offsite', { params }),
  getDetail: (id) => api.get(`/offsite/${id}`),
  create: (data) => api.post('/offsite', data),
  audit: (id, status, auditor) => api.put(`/offsite/${id}/audit`, { status, auditor }),
  getByPerson: (personId) => api.get(`/offsite/person/${personId}`)
}

export const settlementApi = {
  getList: (params) => api.get('/settlements', { params }),
  getDetail: (id) => api.get(`/settlements/${id}`),
  create: (data) => api.post('/settlements', data),
  crossProvinceSettlement: (data) => api.post('/settlements/cross-province-settlement', data),
  getSummary: () => api.get('/settlements/statistics/summary')
}

export const alertsApi = {
  getList: (params) => api.get('/alerts', { params }),
  getDetail: (id) => api.get(`/alerts/${id}`),
  updateStatus: (id, data) => api.put(`/alerts/${id}/status`, data),
  detectFrequentPurchase: (data) => api.post('/alerts/detect/frequent-purchase', data),
  getSummary: () => api.get('/alerts/statistics/summary')
}

export const verificationApi = {
  getList: (params) => api.get('/verifications', { params }),
  getDetail: (id) => api.get(`/verifications/${id}`),
  create: (data) => api.post('/verifications', data),
  createVideo: (data) => api.post('/verifications/video', data),
  updateResult: (id, data) => api.put(`/verifications/${id}/result`, data)
}

export const familyApi = {
  getList: (params) => api.get('/family', { params }),
  getDetail: (id) => api.get(`/family/${id}`),
  create: (data) => api.post('/family', data),
  cancel: (id) => api.put(`/family/${id}/cancel`),
  getMembers: (mainId) => api.get(`/family/main/${mainId}/members`)
}

export const institutionsApi = {
  getList: (params) => api.get('/institutions', { params }),
  getDetail: (id) => api.get(`/institutions/${id}`),
  create: (data) => api.post('/institutions', data),
  update: (id, data) => api.put(`/institutions/${id}`, data),
  delete: (id) => api.delete(`/institutions/${id}`),
  inspection: (id, data) => api.post(`/institutions/${id}/inspection`, data)
}

export const policyApi = {
  getList: (params) => api.get('/policies', { params }),
  getDetail: (id) => api.get(`/policies/${id}`),
  create: (data) => api.post('/policies', data),
  update: (id, data) => api.put(`/policies/${id}`, data),
  delete: (id) => api.delete(`/policies/${id}`),
  getGraph: () => api.get('/policies/graph/relations')
}

export default api
