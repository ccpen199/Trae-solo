import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('haici_token');
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
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.code === 'ERR_NETWORK' || error.response?.status >= 500) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        await new Promise(resolve => setTimeout(resolve, 1000));
        return api(originalRequest);
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('haici_token');
      localStorage.removeItem('haici_user');
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile')
};

export const translationAPI = {
  translate: (text) => api.post('/translate', { text }),
  photoTranslate: (imageData) => api.post('/translate/photo', { image: imageData }),
  getHistory: (params) => api.get('/translate/history', { params })
};

export const dailyAPI = {
  getWord: () => api.get('/daily/word'),
  getReading: () => api.get('/daily/reading'),
  getMovie: () => api.get('/daily/movie'),
  getAll: () => api.get('/daily/all')
};

export const wordbookAPI = {
  addWord: (data) => api.post('/wordbook/add', data),
  getList: (params) => api.get('/wordbook/list', { params }),
  deleteWord: (id) => api.delete(`/wordbook/${id}`)
};

export const discoverAPI = {
  getCourses: () => api.get('/discover/courses'),
  getBooks: () => api.get('/discover/books'),
  getChapter: (bookId, chapterNumber) => api.get(`/discover/book/${bookId}/chapter/${chapterNumber}`)
};

export default api;
