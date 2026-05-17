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
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    const message = error.response?.data?.message || error.message || '请求失败';
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout')
};

export const roomApi = {
  getRooms: (params) => api.get('/rooms', { params }),
  getRoom: (roomId) => api.get(`/rooms/${roomId}`),
  createRoom: (data) => api.post('/rooms', data),
  joinRoom: (roomId, password) => api.post(`/rooms/${roomId}/join`, { password }),
  leaveRoom: (roomId) => api.post(`/rooms/${roomId}/leave`),
  kickUser: (roomId, userId) => api.post(`/rooms/${roomId}/kick/${userId}`),
  sendMessage: (roomId, content) => api.post(`/rooms/${roomId}/message`, { content })
};

export const socialApi = {
  likeUser: (userId) => api.post(`/social/like/${userId}`),
  getFriends: () => api.get('/social/friends'),
  getMessages: (friendId) => api.get(`/social/messages/${friendId}`),
  sendMessage: (friendId, content) => api.post(`/social/messages/${friendId}`, { content }),
  getReceivedLikes: () => api.get('/social/received-likes')
};

export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getUser: (userId) => api.get(`/users/${userId}`),
  getRecentVisits: () => api.get('/users/recent-visits')
};

export const movieApi = {
  getMovies: (params) => api.get('/movies', { params }),
  getHotMovies: () => api.get('/movies/hot'),
  subscribe: (data) => api.post('/movies/subscribe', data),
  unsubscribe: (movieId) => api.delete(`/movies/subscribe/${movieId}`)
};

export default api;
