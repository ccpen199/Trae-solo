import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:44852/api',
  timeout: 10000
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
    }
    return Promise.reject(error)
  }
)

export default {
  cities: {
    getAll: () => api.get('/cities'),
    getHot: () => api.get('/cities?hot=true'),
    locate: (data) => api.post('/cities/locate', data)
  },
  movies: {
    getShowing: (cityId) => api.get('/movies/showing', { params: { city_id: cityId } }),
    getUpcoming: (cityId) => api.get('/movies/upcoming', { params: { city_id: cityId } }),
    getById: (id) => api.get(`/movies/${id}`),
    getSchedules: (id, date) => api.get(`/movies/${id}/schedules`, { params: { date } })
  },
  cinemas: {
    getAll: (cityId) => api.get('/cinemas', { params: { city_id: cityId } }),
    getNearby: (cityId) => api.get('/cinemas/nearby', { params: { city_id: cityId } }),
    getById: (id) => api.get(`/cinemas/${id}`),
    getSchedules: (id, date) => api.get(`/cinemas/${id}/schedules`, { params: { date } })
  },
  schedule: {
    getDates: (movieId, cinemaId) => api.get('/schedule/dates', { params: { movie_id: movieId, cinema_id: cinemaId } }),
    getList: (params) => api.get('/schedule', { params })
  },
  auth: {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data)
  },
  user: {
    getProfile: () => api.get('/user/profile'),
    updateProfile: (data) => api.put('/user/profile', data),
    getFavorites: () => api.get('/user/favorites'),
    addFavorite: (movieId) => api.post('/user/favorites', { movie_id: movieId }),
    deleteFavorite: (movieId) => api.delete(`/user/favorites/${movieId}`),
    getVipBenefits: () => api.get('/user/vip/benefits')
  }
}
