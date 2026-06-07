import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
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
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: data => api.post('/auth/login', data),
  register: data => api.post('/auth/register', data)
}

export const cinemaAPI = {
  list: params => api.get('/cinemas', { params }),
  detail: id => api.get(`/cinemas/${id}`),
  sessions: (id, date) => api.get(`/cinemas/${id}/sessions`, { params: { date } })
}

export const movieAPI = {
  list: params => api.get('/movies', { params }),
  detail: id => api.get(`/movies/${id}`),
  addReview: (id, data) => api.post(`/movies/${id}/reviews`, data)
}

export const sessionAPI = {
  detail: id => api.get(`/sessions/${id}`),
  lockSeats: (id, seats) => api.post(`/sessions/${id}/lock-seats`, { seats })
}

export const orderAPI = {
  create: data => api.post('/orders', data),
  detail: id => api.get(`/orders/${id}`),
  pay: id => api.post(`/orders/${id}/pay`),
  myOrders: params => api.get('/users/orders', { params })
}

export const userAPI = {
  profile: () => api.get('/users/profile'),
  coupons: () => api.get('/users/coupons'),
  points: () => api.get('/benefits/points')
}

export const benefitAPI = {
  packages: () => api.get('/benefits/packages'),
  buyPackage: id => api.post(`/benefits/packages/${id}/buy`)
}

export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  cinemas: () => api.get('/admin/cinemas'),
  createCinema: data => api.post('/admin/cinemas', data),
  updateCinema: (id, data) => api.put(`/admin/cinemas/${id}`, data),
  movies: () => api.get('/admin/movies'),
  createMovie: data => api.post('/admin/movies', data),
  updateMovie: (id, data) => api.put(`/admin/movies/${id}`, data),
  sessions: () => api.get('/admin/sessions'),
  createSession: data => api.post('/admin/sessions', data),
  updateSession: (id, data) => api.put(`/admin/sessions/${id}`, data),
  coupons: () => api.get('/admin/coupons'),
  createCoupon: data => api.post('/admin/coupons', data),
  halls: params => api.get('/admin/halls', { params }),
  createHall: data => api.post('/admin/halls', data),
  logs: params => api.get('/admin/logs', { params })
}

export default api
