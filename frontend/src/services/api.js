import axios from 'axios';

const API_BASE_URL = '/api';

const getToken = () => {
  return localStorage.getItem('token');
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = (data) => apiClient.post('/auth/login', data);
export const logout = () => apiClient.post('/auth/logout');
export const getCurrentUser = () => apiClient.get('/auth/me');
export const changePassword = (data) => apiClient.post('/auth/change-password', data);

export const getUsers = (params) => apiClient.get('/users', { params });
export const getUserById = (id) => apiClient.get(`/users/${id}`);
export const createUser = (data) => apiClient.post('/users', data);
export const updateUser = (id, data) => apiClient.put(`/users/${id}`, data);
export const deleteUser = (id) => apiClient.delete(`/users/${id}`);
export const getOperationLogs = (params) => apiClient.get('/users/logs', { params });

export const getHouseholds = (params) => apiClient.get('/households', { params });
export const getHouseholdById = (id) => apiClient.get(`/households/${id}`);
export const searchHouseholds = (params) => apiClient.get('/households/search', { params });
export const getHouseholdStatistics = () => apiClient.get('/households/statistics');
export const createHousehold = (data) => apiClient.post('/households', data);
export const updateHousehold = (id, data) => apiClient.put(`/households/${id}`, data);
export const moveInHousehold = (id, data) => apiClient.post(`/households/${id}/move-in`, data);
export const moveOutHousehold = (id, data) => apiClient.post(`/households/${id}/move-out`, data);
export const cancelHousehold = (id, data) => apiClient.post(`/households/${id}/cancel`, data);
