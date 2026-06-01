import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:58944/api',
  timeout: 10000
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const hotelApi = {
  getAll: () => api.get('/hotels'),
  create: (data) => api.post('/hotels', data),
  update: (id, data) => api.put(`/hotels/${id}`, data),
  delete: (id) => api.delete(`/hotels/${id}`),
  getRoomTypes: (hotelId) => api.get(`/hotels/${hotelId}/room-types`),
  createRoomType: (data) => api.post('/hotels/room-types', data)
}

export const controlPlanApi = {
  getAll: (params) => api.get('/control-plans', { params }),
  create: (data) => api.post('/control-plans', data),
  update: (id, data) => api.put(`/control-plans/${id}`, data),
  delete: (id) => api.delete(`/control-plans/${id}`),
  adjust: (id, data) => api.post(`/control-plans/${id}/adjust`, data),
  getAdjustments: (planId) => api.get(`/control-plans/${planId}/adjustments`),
  checkExpired: () => api.get('/control-plans/check/expired')
}

export const teamApi = {
  getAll: (params) => api.get('/teams', { params }),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
  getReservations: (teamId) => api.get(`/teams/${teamId}/reservations`),
  createReservation: (data) => api.post('/teams/reservations', data),
  cancelReservation: (id) => api.post(`/teams/reservations/${id}/cancel`),
  getTourists: (teamId) => api.get(`/teams/${teamId}/tourists`),
  addTourist: (data) => api.post('/teams/tourists', data),
  updateTourist: (id, data) => api.put(`/teams/tourists/${id}`, data),
  deleteTourist: (id) => api.delete(`/teams/tourists/${id}`)
}

export const settlementApi = {
  getConfirmations: (params) => api.get('/settlements/confirmations', { params }),
  createConfirmation: (data) => api.post('/settlements/confirmations', data),
  updateConfirmation: (id, data) => api.put(`/settlements/confirmations/${id}`, data),
  getAll: (params) => api.get('/settlements', { params }),
  create: (data) => api.post('/settlements', data),
  update: (id, data) => api.put(`/settlements/${id}`, data),
  getDashboardStats: () => api.get('/settlements/dashboard/stats')
}

export default api
