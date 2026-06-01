import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:58880/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const auth = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data)
}

export const clubs = {
  list: (params) => api.get('/clubs', { params }),
  my: () => api.get('/clubs/my'),
  detail: (id) => api.get(`/clubs/${id}`),
  create: (data) => api.post('/clubs', data),
  approve: (id, data) => api.put(`/clubs/${id}/approve`, data),
  members: (id) => api.get(`/clubs/${id}/members`),
  removeMember: (clubId, userId) => api.post(`/clubs/${clubId}/members/${userId}/remove`),
  changeLeader: (id, data) => api.post(`/clubs/${id}/change-leader`, data),
  history: (id) => api.get(`/clubs/${id}/history`),
  submitReview: (id, data) => api.post(`/clubs/${id}/annual-review`, data),
  reviews: (id) => api.get(`/clubs/${id}/annual-reviews`),
  reviewAnnual: (id, data) => api.put(`/clubs/annual-reviews/${id}/review`, data)
}

export const recruitment = {
  campaigns: (params) => api.get('/recruitment/campaigns', { params }),
  createCampaign: (data) => api.post('/recruitment/campaigns', data),
  campaignDetail: (id) => api.get(`/recruitment/campaigns/${id}`),
  apply: (id, data) => api.post(`/recruitment/campaigns/${id}/apply`, data),
  applications: (id) => api.get(`/recruitment/campaigns/${id}/applications`),
  updateApplicationStatus: (id, data) => api.put(`/recruitment/applications/${id}/status`, data),
  myApplications: () => api.get('/recruitment/my-applications')
}

export const activities = {
  list: (params) => api.get('/activities', { params }),
  my: () => api.get('/activities/my'),
  detail: (id) => api.get(`/activities/${id}`),
  create: (data) => api.post('/activities', data),
  approve: (id, data) => api.put(`/activities/${id}/approve`, data),
  updateStatus: (id, data) => api.put(`/activities/${id}/status`, data),
  signin: (id) => api.post(`/activities/${id}/signin`),
  signins: (id) => api.get(`/activities/${id}/signins`)
}

export const funds = {
  detail: (clubId) => api.get(`/funds/${clubId}`),
  applications: (clubId) => api.get(`/funds/${clubId}/applications`),
  createApplication: (data) => api.post('/funds/applications', data),
  approveApplication: (id, data) => api.put(`/funds/applications/${id}/approve`, data),
  reimburse: (id, data) => api.put(`/funds/applications/${id}/reimburse`, data),
  deposit: (clubId, data) => api.post(`/funds/${clubId}/deposit`, data)
}

export const stats = {
  overview: () => api.get('/stats/overview'),
  membersByClub: () => api.get('/stats/members-by-club'),
  activitiesByClub: () => api.get('/stats/activities-by-club'),
  fundsOverview: () => api.get('/stats/funds-overview'),
  myStats: () => api.get('/stats/my-stats'),
  users: () => api.get('/stats/users'),
  teachers: () => api.get('/stats/teachers')
}

export default api
