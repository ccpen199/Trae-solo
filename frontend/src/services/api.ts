import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  get: <T>(url: string, params?: any): Promise<T> => api.get(url, { params }),
  post: <T>(url: string, data?: any): Promise<T> => api.post(url, data),
  put: <T>(url: string, data?: any): Promise<T> => api.put(url, data),
  delete: <T>(url: string): Promise<T> => api.delete(url),
};

export default api;
