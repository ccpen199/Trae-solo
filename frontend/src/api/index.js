import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const userApi = {
  getCurrentUser: () => api.get('/users/current'),
  getHotels: () => api.get('/users/hotels'),
  getOperators: (hotelId) => api.get('/users/operators', { params: { hotel_id: hotelId } })
}

export const eCurrencyApi = {
  getBalance: () => api.get('/e-currency/balance'),
  getRecords: (params) => api.get('/e-currency/records', { params }),
  getOperatorsWithRecords: () => api.get('/e-currency/operators-with-records'),
  getHotelsWithRecords: () => api.get('/e-currency/hotels-with-records')
}

export const goldCoinsApi = {
  getHotelsWithGold: () => api.get('/gold-coins/hotels-with-gold'),
  getBalance: (hotelId) => api.get('/gold-coins/balance', { params: { hotel_id: hotelId } }),
  getRecords: (params) => api.get('/gold-coins/records', { params }),
  getOperatorsWithRecords: (hotelId) => api.get('/gold-coins/operators-with-records', { params: { hotel_id: hotelId } })
}

export default api
