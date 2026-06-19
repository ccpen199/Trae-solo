import axios from 'axios';

const getDeviceId = () => {
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
    localStorage.setItem('device_id', id);
  }
  return id;
};

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('user_token');
  config.headers['x-device-id'] = getDeviceId();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => {
    const { data } = response;
    if (data.code === 0) {
      return data.data;
    }
    if (data.code === 401) {
      localStorage.removeItem('user_token');
      localStorage.removeItem('user_info');
      window.location.hash = '#/login';
    }
    return Promise.reject(new Error(data.message || '请求失败'));
  },
  (error) => {
    const msg = error.response?.data?.message || error.message || '网络错误';
    return Promise.reject(new Error(msg));
  }
);

export default request;
