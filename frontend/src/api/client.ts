import axios from 'axios';

const DEMO_TOKEN = 'local-demo-admin-token';
const DEMO_USER = {
  id: 1,
  phone: '13800000000',
  name: '演示管理员',
  role: 'admin',
  isVerified: true,
  rating: 5,
  orderCount: 128,
  faceVerified: true,
};

function setDemoSession() {
  localStorage.setItem('token', DEMO_TOKEN);
  localStorage.setItem('user', JSON.stringify(DEMO_USER));
}

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  let token = localStorage.getItem('token');
  if (!token) {
    setDemoSession();
    token = DEMO_TOKEN;
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const originalRequest = error.config || {};
    if ((status === 401 || status === 403) && !originalRequest.__demoRetry) {
      originalRequest.__demoRetry = true;
      setDemoSession();
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${DEMO_TOKEN}`;
      return api(originalRequest);
    }
    return Promise.reject(error);
  }
);

export default api;
