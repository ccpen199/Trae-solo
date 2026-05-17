import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response) {
      const { status } = error.response;
      
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(new Error('请重新登录'));
      }
      
      if (status === 403) {
        return Promise.reject(new Error('暂无权限'));
      }
      
      if (status === 404) {
        return Promise.reject(new Error('资源不存在'));
      }
      
      if (status >= 500) {
        return Promise.reject(new Error('服务器错误，请稍后重试'));
      }
    }
    
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      return Promise.reject(new Error('网络异常，请检查网络连接'));
    }
    
    if (!originalRequest._retry && error.code === 'ECONNABORTED') {
      originalRequest._retry = true;
      return api(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  sendCode: (phone) => api.post('/auth/send-code', { phone }),
  login: (phone, code) => api.post('/auth/login', { phone, code }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

export const videoAPI = {
  getRecommend: (page = 1, limit = 10) => api.get(`/videos/recommend?page=${page}&limit=${limit}`),
  getNearby: (page = 1, limit = 10) => api.get(`/videos/nearby?page=${page}&limit=${limit}`),
  getDetail: (id) => api.get(`/videos/${id}`),
  create: (data) => api.post('/videos', data),
  like: (id) => api.post(`/videos/${id}/like`),
  favorite: (id) => api.post(`/videos/${id}/favorite`),
  share: (id) => api.post(`/videos/${id}/share`)
};

export const commentAPI = {
  getByVideo: (videoId, page = 1, limit = 20) => api.get(`/comments/video/${videoId}?page=${page}&limit=${limit}`),
  create: (data) => api.post('/comments', data),
  like: (id) => api.post(`/comments/${id}/like`)
};

export const liveAPI = {
  getList: (page = 1, limit = 20) => api.get(`/live/list?page=${page}&limit=${limit}`),
  getDetail: (id) => api.get(`/live/${id}`),
  create: (data) => api.post('/live', data),
  end: (id) => api.post(`/live/${id}/end`)
};

export const searchAPI = {
  getHot: () => api.get('/search/hot'),
  searchVideos: (keyword, page = 1, limit = 20) => api.get(`/search/videos?keyword=${encodeURIComponent(keyword)}&page=${page}&limit=${limit}`),
  getHistory: () => api.get('/search/history')
};

export const followAPI = {
  follow: (userId) => api.post(`/follows/${userId}`),
  getFollowers: (userId, page = 1, limit = 20) => api.get(`/follows/followers/${userId}?page=${page}&limit=${limit}`),
  getFollowing: (userId, page = 1, limit = 20) => api.get(`/follows/following/${userId}?page=${page}&limit=${limit}`)
};

export default api;
