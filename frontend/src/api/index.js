import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    return Promise.reject(error)
  }
)

export const cityApi = {
  getCities: () => api.get('/cities'),
  getCity: (id) => api.get(`/cities/${id}`),
  locateByIp: () => api.get('/cities/locate/by-ip')
}

export const movieApi = {
  getMovies: (params) => api.get('/movies', { params }),
  getMovie: (id) => api.get(`/movies/${id}`)
}

export const cinemaApi = {
  getCinemas: (params) => api.get('/cinemas', { params }),
  getCinema: (id) => api.get(`/cinemas/${id}`)
}

export const scheduleApi = {
  getSchedules: (params) => api.get('/schedules', { params })
}

export const userApi = {
  register: (data) => api.post('/users/register', data),
  login: (data) => api.post('/users/login', data)
}

export default api
