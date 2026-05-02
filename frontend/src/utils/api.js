import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
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
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
};

export const matchApi = {
  create: (data) => api.post('/matches/create', data),
  getList: (params) => api.get('/matches', { params }),
  getById: (id) => api.get(`/matches/${id}`),
  start: (id) => api.post(`/matches/${id}/start`),
  end: (id) => api.post(`/matches/${id}/end`),
  report: (id, data) => api.post(`/matches/${id}/report`, data),
  quickReport: (data) => api.post('/matches/quick-report', data),
};

export const leaderboardApi = {
  getList: () => api.get('/leaderboards'),
  getById: (id, params) => api.get(`/leaderboards/${id}`, { params }),
  refresh: (id) => api.post(`/leaderboards/${id}/refresh`),
  refreshAll: () => api.post('/leaderboards/refresh-all'),
  getMyRank: () => api.get('/leaderboards/my/rank'),
};

export const rewardApi = {
  getMyRewards: (params) => api.get('/rewards', { params }),
  getAllRewards: (params) => api.get('/rewards/all', { params }),
  create: (data) => api.post('/rewards/create', data),
  claim: (id) => api.post(`/rewards/${id}/claim`),
  getById: (id) => api.get(`/rewards/${id}`),
  getHistory: (userId, params) => api.get(`/rewards/user/${userId}/history`, { params }),
};
