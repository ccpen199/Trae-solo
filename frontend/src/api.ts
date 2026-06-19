import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

let latestError: string | null = null;
export const getLatestError = () => latestError;
export const clearLatestError = () => { latestError = null; };

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const community = localStorage.getItem('community');
  if (community) {
    try {
      const communityObj = JSON.parse(community);
      if (communityObj.id) {
        config.headers['X-Community-Id'] = String(communityObj.id);
      }
    } catch (e) {
      console.warn('[api] community JSON.parse 失败:', e);
    }
  }
  console.log(`[api] ${config.method?.toUpperCase()} ${config.url}`, {
    hasToken: !!token,
    communityHeader: config.headers['X-Community-Id'] || null,
  });
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`[api] ✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    const method = error?.config?.method?.toUpperCase() || '';
    const errMsg = error?.response?.data?.error || error?.message || `HTTP ${status}`;
    latestError = `${method} ${url} 失败: ${errMsg}`;
    console.error(`[api] ❌ ${method} ${url} status=${status} error=${errMsg}`);

    const isLoginPage = window.location.pathname.startsWith('/login');
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/saml') || url.includes('/auth/communities');
    const hasToken = !!localStorage.getItem('token');

    if (status === 401 && hasToken && !isLoginPage && !isAuthEndpoint) {
      console.warn('[api] 401 且已在其他页面，token 失效，跳转到登录页');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('community');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);

export default api;
