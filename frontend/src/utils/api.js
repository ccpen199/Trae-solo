import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getCities = (keyword) => api.get('/cities', { params: { keyword } });
export const getHotCities = () => api.get('/cities/hot');
export const submitSearch = (data) => api.post('/search', data);
export const getSearchHistory = () => api.get('/search/history');
export const getUserPreferences = () => api.get('/user/preferences');

export const bookTrain = (data) => api.post('/train/booking', data);
export const getTrainOrders = () => api.get('/train/orders');
export const getTrainOrderDetail = (orderId) => api.get(`/train/orders/${orderId}`);

export default api;
