import axios from 'axios';
import type { ApiResponse } from '../../shared/types';

function getOrCreateSessionId(): string {
  let sid = localStorage.getItem('weather_session_id');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('weather_session_id', sid);
  }
  return sid;
}

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  config.headers['X-Session-Id'] = getOrCreateSessionId();
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse;
    if (data.code !== 0) {
      return Promise.reject(new Error(data.message || '请求失败'));
    }
    return data.data as any;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || '网络错误';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
export { getOrCreateSessionId };
