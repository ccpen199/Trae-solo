import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const trainApi = {
  list: async (params = {}) => {
    const response = await api.get('/trains', { params });
    return response.data;
  },
  
  search: async (params) => {
    const response = await api.get('/trains/search', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/trains/${id}`);
    return response.data;
  },
  
  getByNumber: async (trainNumber, travelDate) => {
    const response = await api.get(`/trains/number/${trainNumber}`, { params: { travelDate } });
    return response.data;
  },
  
  getStations: async () => {
    const response = await api.get('/trains/stations/list');
    return response.data;
  },
};

export const ticketApi = {
  list: async (params = {}) => {
    const response = await api.get('/tickets', { params });
    return response.data;
  },
  
  getAvailable: async (params) => {
    const response = await api.get('/tickets/available', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },
  
  getInventorySummary: async (params = {}) => {
    const response = await api.get('/tickets/inventory/summary', { params });
    return response.data;
  },
};

export const orderApi = {
  list: async (params = {}) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },
  
  book: async (data) => {
    const response = await api.post('/orders/book', data);
    return response.data;
  },
  
  windowSell: async (data) => {
    const response = await api.post('/orders/window/sell', data);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  
  searchByPassenger: async (params) => {
    const response = await api.get('/orders/passenger/search', { params });
    return response.data;
  },
};

export const refundApi = {
  list: async (params = {}) => {
    const response = await api.get('/refunds', { params });
    return response.data;
  },
  
  apply: async (data) => {
    const response = await api.post('/refunds/apply', data);
    return response.data;
  },
  
  searchOrders: async (params) => {
    const response = await api.get('/refunds/search/order', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/refunds/${id}`);
    return response.data;
  },
};

export default api;
