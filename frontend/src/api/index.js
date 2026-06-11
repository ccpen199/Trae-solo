import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code && res.code !== 200) {
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
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
  login: (data) => request.post('/auth/login', data),
  register: (data) => request.post('/auth/register', data),
}

export const ownerAPI = {
  getStations: (params) => request.get('/owner/stations', { params }),
  getStationDetail: (id) => request.get(`/owner/stations/${id}`),
  getChargers: (params) => request.get('/owner/chargers', { params }),
  getChargerDetail: (id) => request.get(`/owner/chargers/${id}`),
  getChargerStatus: (id) => request.get(`/owner/chargers/${id}/status`),
  startCharging: (data) => request.post('/owner/orders/start', data),
  stopCharging: (id) => request.post(`/owner/orders/${id}/stop`),
  adjustPower: (id, data) => request.post(`/owner/orders/${id}/power`, data),
  getOrders: (params) => request.get('/owner/orders', { params }),
  getOrderDetail: (id) => request.get(`/owner/orders/${id}`),
  createReservation: (data) => request.post('/owner/reservations', data),
  getReservations: (params) => request.get('/owner/reservations', { params }),
  cancelReservation: (id) => request.post(`/owner/reservations/${id}/cancel`),
  planPath: (data) => request.post('/owner/path-planning', data),
}

export const stationAPI = {
  getOverview: () => request.get('/station/overview'),
  getChargers: (params) => request.get('/station/chargers', { params }),
  addCharger: (data) => request.post('/station/chargers', data),
  updateCharger: (id, data) => request.put(`/station/chargers/${id}`, data),
  remoteControl: (id, data) => request.post(`/station/chargers/${id}/remote-control`, data),
  getAlarms: (params) => request.get('/station/alarms', { params }),
  handleAlarm: (id, data) => request.post(`/station/alarms/${id}/handle`, data),
  simulateAlarm: (data) => request.post('/station/alarms/simulate', data),
  getStatsSummary: (params) => request.get('/station/stats/summary', { params }),
  getStatsProfile: () => request.get('/station/stats/profile'),
  getServices: () => request.get('/station/services'),
}

export const platformAPI = {
  getUserProfile: () => request.get('/platform/user/profile'),
  updateVehicle: (data) => request.put('/platform/user/vehicle', data),
  getPrivatePiles: (params) => request.get('/platform/private-piles', { params }),
  addPrivatePile: (data) => request.post('/platform/private-piles', data),
  updatePrivatePile: (id, data) => request.put(`/platform/private-piles/${id}`, data),
  updateTimeSlots: (id, data) => request.post(`/platform/private-piles/${id}/timeslots`, data),
  getGreenCertificates: (params) => request.get('/platform/green-certificates', { params }),
  verifyCertificate: (id) => request.get(`/platform/green-certificates/${id}/verify`),
  getChargingBehavior: (params) => request.get('/platform/analysis/charging-behavior', { params }),
  getCarbonAnalysis: (params) => request.get('/platform/analysis/carbon', { params }),
  getGovernmentDashboard: (params) => request.get('/platform/government/dashboard', { params }),
}

export default request
