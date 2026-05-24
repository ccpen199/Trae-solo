import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:53266'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me')
}

export const petAPI = {
  getPets: () => api.get('/pets'),
  getPet: (id) => api.get(`/pets/${id}`),
  createPet: (data) => api.post('/pets', data),
  updatePet: (id, data) => api.put(`/pets/${id}`, data),
  addVaccine: (petId, data) => api.post(`/pets/${petId}/vaccines`, data),
  deleteVaccine: (petId, vaccineId) => api.delete(`/pets/${petId}/vaccines/${vaccineId}`)
}

export const serviceAPI = {
  getServices: (params) => api.get('/services', { params }),
  getService: (id) => api.get(`/services/${id}`),
  getServiceSlots: (id, date) => api.get(`/services/${id}/slots`, { params: { date } }),
  createService: (data) => api.post('/services', data),
  updateService: (id, data) => api.put(`/services/${id}`, data),
  getRooms: (params) => api.get('/services/rooms/list', { params }),
  createRoom: (data) => api.post('/services/rooms', data),
  getConsumables: (params) => api.get('/services/consumables/list', { params }),
  createConsumable: (data) => api.post('/services/consumables', data),
  createSlot: (data) => api.post('/services/slots', data)
}

export const appointmentAPI = {
  getAppointments: (params) => api.get('/appointments', { params }),
  getAppointment: (id) => api.get(`/appointments/${id}`),
  validateAppointment: (data) => api.post('/appointments/validate', data),
  createAppointment: (data) => api.post('/appointments', data),
  confirmAppointment: (id, data) => api.put(`/appointments/${id}/confirm`, data),
  cancelAppointment: (id, data) => api.put(`/appointments/${id}/cancel`, data),
  checkIn: (id) => api.put(`/appointments/${id}/checkin`),
  checkOut: (id) => api.put(`/appointments/${id}/checkout`)
}

export const transportAPI = {
  getTasks: (params) => api.get('/transport', { params }),
  getTask: (id) => api.get(`/transport/${id}`),
  assignTask: (id, data) => api.put(`/transport/${id}/assign`, data),
  startTask: (id) => api.put(`/transport/${id}/start`),
  arriveTask: (id, data) => api.put(`/transport/${id}/arrive`, data),
  delayTask: (id, data) => api.put(`/transport/${id}/delay`, data),
  completeTask: (id) => api.put(`/transport/${id}/complete`)
}

export const recordAPI = {
  getRecords: (params) => api.get('/records', { params }),
  getRecord: (id) => api.get(`/records/${id}`),
  updateRecord: (id, data) => api.put(`/records/${id}`, data),
  addPhoto: (id, data) => api.post(`/records/${id}/photos`, data),
  addConsumable: (id, data) => api.post(`/records/${id}/consumables`, data),
  deletePhoto: (id, photoId) => api.delete(`/records/${id}/photos/${photoId}`)
}

export const feeAPI = {
  getFees: (params) => api.get('/fees', { params }),
  getFee: (id) => api.get(`/fees/${id}`),
  payFee: (id, data) => api.put(`/fees/${id}/pay`, data),
  disputeFee: (id, data) => api.put(`/fees/${id}/dispute`, data),
  resolveDispute: (id, data) => api.put(`/fees/${id}/resolve-dispute`, data),
  adjustFee: (id, data) => api.put(`/fees/${id}/adjust`, data)
}

export const reviewAPI = {
  getReviews: (params) => api.get('/reviews', { params }),
  getReview: (id) => api.get(`/reviews/${id}`),
  createReview: (data) => api.post('/reviews', data),
  markRepurchase: (id) => api.post(`/reviews/${id}/repurchase`)
}

export const complaintAPI = {
  getComplaints: (params) => api.get('/complaints', { params }),
  getComplaint: (id) => api.get(`/complaints/${id}`),
  createComplaint: (data) => api.post('/complaints', data),
  handleComplaint: (id, data) => api.put(`/complaints/${id}/handle`, data),
  closeComplaint: (id) => api.put(`/complaints/${id}/close`)
}

export const statsAPI = {
  getOverview: (params) => api.get('/stats/overview', { params }),
  getDaily: (params) => api.get('/stats/daily', { params }),
  getStaff: (params) => api.get('/stats/staff', { params }),
  getServices: (params) => api.get('/stats/services', { params }),
  getComplaints: () => api.get('/stats/complaints')
}

export default api
