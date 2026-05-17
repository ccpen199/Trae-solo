import axios from 'axios';
import type { ApiResponse, Video, Advertisement, User, PlayRecord } from '../types';

const API_BASE_URL = 'http://localhost:47830/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.code === 'ECONNABORTED' && !originalRequest._retry) {
      originalRequest._retry = true;
      return apiClient(originalRequest);
    }
    
    if (error.response) {
      const { status } = error.response;
      switch (status) {
        case 401:
          console.error('未授权，请重新登录');
          break;
        case 403:
          console.error('无权限访问');
          break;
        case 404:
          console.error('资源不存在');
          break;
        case 500:
          console.error('服务器错误');
          break;
        default:
          console.error('请求失败:', error.message);
      }
    } else if (error.request) {
      console.error('网络连接失败，请检查网络');
    }
    
    return Promise.reject(error);
  }
);

export const videoApi = {
  getVideos: (page = 1, pageSize = 20): Promise<ApiResponse<{ list: Video[]; total: number }>> =>
    apiClient.get('/videos', { params: { page, pageSize } }).then(res => res.data),

  getVideo: (id: number): Promise<ApiResponse<Video>> =>
    apiClient.get(`/videos/${id}`).then(res => res.data),

  getQualities: (id: number): Promise<ApiResponse<VideoQuality[]>> =>
    apiClient.get(`/videos/${id}/qualities`).then(res => res.data),

  saveProgress: (id: number, progress: number, duration: number, userId?: number): Promise<ApiResponse> =>
    apiClient.post(`/videos/${id}/progress`, { progress, duration, userId }).then(res => res.data),
};

export const adApi = {
  getAd: (type: string, videoId?: number): Promise<ApiResponse<Advertisement>> =>
    apiClient.get(`/ads/${type}`, { params: { videoId } }).then(res => res.data),

  getMidAd: (videoId: number): Promise<ApiResponse<Advertisement>> =>
    apiClient.get(`/ads/mid/${videoId}`).then(res => res.data),

  recordClick: (adId: number, userId?: number): Promise<ApiResponse> =>
    apiClient.post(`/ads/${adId}/click`, { userId }).then(res => res.data),
};

export const userApi = {
  login: (username: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> =>
    apiClient.post('/users/login', { username, password }).then(res => res.data),

  getVipStatus: (userId: number): Promise<ApiResponse<User>> =>
    apiClient.get(`/users/${userId}/vip-status`).then(res => res.data),

  getPlayRecords: (userId: number, page = 1, pageSize = 20): Promise<ApiResponse<{ list: PlayRecord[]; total: number }>> =>
    apiClient.get(`/users/${userId}/play-records`, { params: { page, pageSize } }).then(res => res.data),

  getSettings: (): Promise<ApiResponse<Record<string, string>>> =>
    apiClient.get('/users/settings').then(res => res.data),

  saveSettings: (userId: number, settings: { auto_play?: boolean; default_quality?: string }): Promise<ApiResponse> =>
    apiClient.post(`/users/${userId}/settings`, settings).then(res => res.data),
};

export const adminApi = {
  getStats: (): Promise<ApiResponse<any>> =>
    apiClient.get('/admin/stats').then(res => res.data),

  getVideos: (page = 1, pageSize = 20, status?: string): Promise<ApiResponse<{ list: Video[]; total: number }>> =>
    apiClient.get('/admin/videos', { params: { page, pageSize, status } }).then(res => res.data),

  createVideo: (video: Partial<Video>): Promise<ApiResponse> =>
    apiClient.post('/admin/videos', video).then(res => res.data),

  updateVideo: (id: number, video: Partial<Video>): Promise<ApiResponse> =>
    apiClient.put(`/admin/videos/${id}`, video).then(res => res.data),

  deleteVideo: (id: number): Promise<ApiResponse> =>
    apiClient.delete(`/admin/videos/${id}`).then(res => res.data),

  getAds: (): Promise<ApiResponse<Advertisement[]>> =>
    apiClient.get('/admin/ads').then(res => res.data),

  createAd: (ad: Partial<Advertisement>): Promise<ApiResponse> =>
    apiClient.post('/admin/ads', ad).then(res => res.data),
};

export default apiClient;
