import axios from 'axios'

const API_BASE = '/api'

const request = axios.create({
  baseURL: API_BASE,
  timeout: 15000
})

request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userType')
      localStorage.removeItem('userInfo')
      window.location.hash = '#/login'
    }
    return Promise.reject(error.response?.data || error)
  }
)

export const auth = {
  memberLogin: (data) => request.post('/auth/member/login', data),
  memberRegister: (data) => request.post('/auth/member/register', data),
  staffLogin: (data) => request.post('/auth/staff/login', data),
  getMe: () => request.get('/auth/me')
}

export const member = {
  getVehicles: () => request.get('/member/vehicles'),
  addVehicle: (data) => request.post('/member/vehicles', data),
  deleteVehicle: (id) => request.delete(`/member/vehicles/${id}`),
  setDefaultVehicle: (id) => request.put(`/member/vehicles/${id}/default`),
  getCoupons: (status) => request.get('/member/coupons', { params: { status } }),
  getTransactions: (params) => request.get('/member/transactions', { params }),
  getTransactionsAvailableForInvoice: () => request.get('/member/transactions-available-for-invoice'),
  getStoredValueHistory: () => request.get('/member/stored-value-history'),
  storedValue: (data) => request.post('/member/stored-value', data),
  getInvoices: () => request.get('/member/invoices'),
  applyInvoice: (data) => request.post('/member/invoices', data),
  getComplaints: () => request.get('/member/complaints'),
  submitComplaint: (data) => request.post('/member/complaints', data)
}

export const transaction = {
  calculate: (data) => request.post('/transaction/calculate', data),
  create: (data) => request.post('/transaction/create', data),
  list: (params) => request.get('/transaction/list', { params }),
  detail: (id) => request.get(`/transaction/${id}`)
}

export const station = {
  list: () => request.get('/station/list'),
  fuelTypes: () => request.get('/station/fuel-types'),
  getPrices: (id) => request.get(`/station/${id}/prices`),
  getNozzles: (id) => request.get(`/station/${id}/nozzles`),
  getInventory: (id) => request.get(`/station/${id}/inventory`),
  adjustPrice: (data) => request.post('/station/price-adjust', data),
  addInventory: (data) => request.post('/station/inventory/delivery', data)
}

export const shift = {
  start: (data) => request.post('/shift/start', data),
  end: (data) => request.post('/shift/end', data),
  myShift: () => request.get('/shift/my-shift')
}

export const report = {
  dashboard: (params) => request.get('/report/dashboard', { params }),
  memberAnalysis: (params) => request.get('/report/member-analysis', { params }),
  couponAnalysis: () => request.get('/report/coupon-analysis'),
  dailySales: (params) => request.get('/report/daily-sales', { params }),
  getComplaints: (params) => request.get('/report/complaints', { params }),
  handleComplaint: (id, data) => request.put(`/report/complaints/${id}/handle`, data),
  getInvoices: (params) => request.get('/report/invoices', { params }),
  issueInvoice: (id, data) => request.put(`/report/invoices/${id}/issue`, data)
}

export default request
