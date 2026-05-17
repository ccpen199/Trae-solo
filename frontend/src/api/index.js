import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:47921/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  config => config,
  error => Promise.reject(error)
);

api.interceptors.response.use(
  response => {
    if (response.data.success) {
      return response.data;
    }
    return Promise.reject(new Error(response.data.message || '请求失败'));
  },
  async error => {
    const originalRequest = error.config;
    if (!originalRequest._retry && error.code !== 'ERR_CANCELED') {
      originalRequest._retry = true;
      try {
        const response = await api(originalRequest);
        return response;
      } catch {
        return Promise.reject(error);
      }
    }
    
    let message = '网络请求失败';
    if (error.response) {
      switch (error.response.status) {
        case 400: message = '参数错误'; break;
        case 401: message = '请先登录'; break;
        case 403: message = '没有权限'; break;
        case 404: message = '资源不存在'; break;
        case 500: message = '服务器错误'; break;
        default: message = error.response.data?.message || `请求失败 (${error.response.status})`;
      }
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时，请检查网络';
    } else if (error.message) {
      message = error.message;
    }
    
    return Promise.reject(new Error(message));
  }
);

export const videoAPI = {
  getList: (params = {}) => api.get('/videos', { params }),
  getDetail: (id) => api.get(`/videos/${id}`),
  toggleLike: (id) => api.post(`/videos/${id}/like`, { user_id: 1 }),
  getComments: (id) => api.get(`/videos/${id}/comments`),
  addComment: (id, content) => api.post(`/videos/${id}/comments`, { user_id: 1, content })
};

export default api;
