import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:59024/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true
});

api.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('token');
    if (!token && config.url?.startsWith('/admin')) {
      token = 'local-demo-admin-token';
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        username: 'admin',
        role: 'admin',
        status: 'active'
      }));
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

export const movieAPI = {
  getMovies: (params) => api.get('/movies', { params }),
  getMovie: (id) => api.get(`/movies/${id}`),
  createMovie: (data) => api.post('/movies', data),
  updateMovie: (id, data) => api.put(`/movies/${id}`, data)
};

export const tvAPI = {
  getShows: (params) => api.get('/tv', { params }),
  getTVShows: (params) => api.get('/tv', { params }),
  getShow: (id) => api.get(`/tv/${id}`),
  getTVShow: (id) => api.get(`/tv/${id}`),
  getSeason: (id, seasonNumber) => api.get(`/tv/${id}/seasons/${seasonNumber}`)
};

export const peopleAPI = {
  getPeople: (params) => api.get('/people', { params }),
  getPerson: (id) => api.get(`/people/${id}`),
  suggestEdit: (id, data) => api.post(`/people/${id}/suggest-edit`, data),
  createPerson: (data) => api.post('/people', data)
};

export const reviewAPI = {
  getReviews: (params) => api.get('/reviews', { params }),
  getReview: (id) => api.get(`/reviews/${id}`),
  createReview: (data) => api.post('/reviews', data),
  likeReview: (id) => api.post(`/reviews/${id}/like`)
};

export const playlistAPI = {
  getPlaylists: (params) => api.get('/playlists', { params }),
  getPlaylist: (id) => api.get(`/playlists/${id}`),
  createPlaylist: (data) => api.post('/playlists', data),
  addItem: (id, data) => api.post(`/playlists/${id}/items`, data),
  removeItem: (id, itemId) => api.delete(`/playlists/${id}/items/${itemId}`),
  likePlaylist: (id) => api.post(`/playlists/${id}/like`)
};

export const newsAPI = {
  getNews: (params) => api.get('/news', { params }),
  getNewsItem: (id) => api.get(`/news/${id}`),
  getNewsTypes: () => api.get('/news/types/stats'),
  createNews: (data) => api.post('/news', data)
};

export const communityAPI = {
  getTopics: (params) => api.get('/community/topics', { params }),
  getTopic: (id) => api.get(`/community/topics/${id}`),
  getTopicPosts: (id, params) => api.get(`/community/topics/${id}/posts`, { params }),
  createTopic: (data) => api.post('/community/topics', data),
  createPost: (topicId, data) => api.post(`/community/topics/${topicId}/posts`, data),
  getBattles: (params) => api.get('/community/battles', { params }),
  getBattle: (id) => api.get(`/community/battles/${id}`),
  createBattle: (data) => api.post('/community/battles', data),
  voteBattle: (id, data) => api.post(`/community/battles/${id}/vote`, data),
  getViewingGroups: (params) => api.get('/community/viewing-groups', { params }),
  createViewingGroup: (data) => api.post('/community/viewing-groups', data)
};

export const quizAPI = {
  getQuizzes: (params) => api.get('/quizzes', { params }),
  getQuiz: (id) => api.get(`/quizzes/${id}`),
  attemptQuiz: (id, data) => api.post(`/quizzes/${id}/attempt`, data),
  getLeaderboard: (params) => api.get('/quizzes/leaderboard', { params }),
  getPrizes: () => api.get('/quizzes/prizes'),
  redeemPrize: (id) => api.post(`/quizzes/prizes/${id}/redeem`),
  createQuiz: (data) => api.post('/quizzes', data)
};

export const liveAPI = {
  getStreams: (params) => api.get('/live', { params }),
  getStream: (id) => api.get(`/live/${id}`),
  createStream: (data) => api.post('/live', data),
  startStream: (id) => api.post(`/live/${id}/start`),
  endStream: (id) => api.post(`/live/${id}/end`),
  verifyCopyright: (id, data) => api.put(`/live/${id}/verify-copyright`, data),
  viewerCount: (id) => api.post(`/live/${id}/viewer`),
  likeStream: (id) => api.post(`/live/${id}/like`)
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getPendingReviews: (params) => api.get('/admin/reviews/pending', { params }),
  moderateReview: (id, data) => api.post(`/admin/reviews/${id}/moderate`, data),
  getPendingEdits: () => api.get('/admin/edit-suggestions/pending'),
  moderateEdit: (id, data) => api.post(`/admin/edit-suggestions/${id}/moderate`, data),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  getModerationLogs: (params) => api.get('/admin/moderation-logs', { params }),
  getVideoSources: (params) => api.get('/admin/video-sources', { params }),
  verifyVideoSource: (id, data) => api.put(`/admin/video-sources/${id}/verify`, data)
};

export default api;
