import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile')
};

export const translationAPI = {
  translate: (data) => api.post('/translation/translate', data),
  getHistory: (params) => api.get('/translation/history', { params }),
  clearHistory: () => api.delete('/translation/history'),
  addFavorite: (data) => api.post('/translation/favorite', data),
  getFavorites: (params) => api.get('/translation/favorites', { params }),
  voiceTranslate: (data) => api.post('/translation/voice', data)
};

export const simultaneousAPI = {
  startSession: (data) => api.post('/simultaneous/session/start', data),
  translate: (sessionId, data) => api.post(`/simultaneous/session/${sessionId}/translate`, data),
  getTranslations: (sessionId, params) => api.get(`/simultaneous/session/${sessionId}/translations`, { params }),
  endSession: (sessionId) => api.post(`/simultaneous/session/${sessionId}/end`)
};

export const cameraAPI = {
  uploadImage: (formData) => api.post('/camera/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  extractWords: (formData) => api.post('/camera/word', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export const speakingAPI = {
  getSentences: (params) => api.get('/speaking/sentences', { params }),
  submitPractice: (data) => api.post('/speaking/practice', data),
  getHistory: (params) => api.get('/speaking/history', { params }),
  publish: (data) => api.post('/speaking/publish', data)
};

export const worldAPI = {
  getPosts: (params) => api.get('/world/posts', { params }),
  getPost: (postId) => api.get(`/world/posts/${postId}`),
  toggleLike: (postId) => api.post(`/world/posts/${postId}/like`)
};

export default api;
