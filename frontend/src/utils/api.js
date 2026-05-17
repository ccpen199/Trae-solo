import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:47791/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('响应错误:', error);
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return Promise.reject(new Error('请求超时，请稍后重试'));
    }
    if (!error.response) {
      return Promise.reject(new Error('网络连接失败，请检查网络'));
    }
    const { status } = error.response;
    let message = '请求失败';
    switch (status) {
      case 401:
        message = '未授权，请重新登录';
        break;
      case 403:
        message = '拒绝访问';
        break;
      case 404:
        message = '资源不存在';
        break;
      case 500:
        message = '服务器内部错误';
        break;
      default:
        message = error.response.data?.message || `请求失败 (${status})`;
    }
    return Promise.reject(new Error(message));
  }
);

export const songsAPI = {
  getSongs: (params = {}) => api.get('/songs', { params }),
  getRecommendSongs: (limit = 10) => api.get('/songs/recommend', { params: { limit } }),
  getSongDetail: (id) => api.get(`/songs/${id}`),
  playSong: (id, data) => api.post(`/songs/${id}/play`, data),
  likeSong: (id, data) => api.post(`/songs/${id}/like`, data),
  dislikeSong: (id, data) => api.post(`/songs/${id}/dislike`, data),
  coinSong: (id, data) => api.post(`/songs/${id}/coin`, data),
};

export const playlistsAPI = {
  getPlaylists: (params = {}) => api.get('/playlists', { params }),
  getRecommendPlaylists: (limit = 6) => api.get('/playlists/recommend', { params: { limit } }),
  getPlaylistDetail: (id) => api.get(`/playlists/${id}`),
  playPlaylist: (id) => api.post(`/playlists/${id}/play`),
};

export const rankingsAPI = {
  getSongRanking: (type = 'plays', limit = 50) => api.get('/rankings/songs', { params: { type, limit } }),
  getArtistRanking: (limit = 20) => api.get('/rankings/artists', { params: { limit } }),
};

export const adsAPI = {
  getAds: (position) => api.get('/ads', { params: { position } }),
};

export const categoriesAPI = {
  getCategories: () => api.get('/categories'),
};

export const homeAPI = {
  getHomeData: () => api.get('/home/data'),
};

export default api;
