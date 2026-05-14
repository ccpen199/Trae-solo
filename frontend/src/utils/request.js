import axios from 'axios';

const TOKEN_KEY = 'me_tao_token';
const MAX_RETRY = 1;
const TIMEOUT = 10000;

let toastQueue = [];
let isShowingToast = false;

export function setToastHandler(handler) {
  window.__ME_TAO_TOAST_HANDLER__ = handler;
}

export function showToast(message, type = 'info') {
  if (window.__ME_TAO_TOAST_HANDLER__) {
    window.__ME_TAO_TOAST_HANDLER__(message, type);
  } else {
    console.log(`[${type.toUpperCase()}]: ${message}`);
  }
}

const request = axios.create({
  baseURL: '/api',
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const handleError = (error) => {
  const response = error?.response;
  const status = response?.status;
  const data = response?.data;

  if (status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
      window.location.href = '/login';
    }
    showToast(data?.message || '登录已过期，请重新登录', 'error');
  } else if (status === 403) {
    showToast(data?.message || '无权限访问', 'error');
  } else if (status === 404) {
    showToast(data?.message || '资源不存在', 'error');
  } else if (status >= 500) {
    showToast(data?.message || '服务器错误，请稍后重试', 'error');
  } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    showToast('请求超时，请检查网络', 'error');
  } else if (!error.response) {
    showToast('网络连接失败，请检查网络', 'error');
  } else {
    showToast(data?.message || '请求失败', 'error');
  }

  return Promise.reject(error);
};

request.interceptors.response.use(
  (response) => {
    const data = response.data;
    
    if (data && data.success === false) {
      showToast(data.message || '请求失败', 'error');
      return Promise.reject(new Error(data.message || '请求失败'));
    }

    return response.data;
  },
  async (error) => {
    const config = error.config;

    if (config && !config.__retryCount) {
      config.__retryCount = 0;
    }

    if (config && config.__retryCount < MAX_RETRY && !error.response) {
      config.__retryCount += 1;
      console.log(`请求重试 ${config.__retryCount}/${MAX_RETRY}`);
      return request(config);
    }

    return handleError(error);
  }
);

export const api = {
  get: (url, params) => request.get(url, { params }),
  post: (url, data) => request.post(url, data),
  put: (url, data) => request.put(url, data),
  delete: (url) => request.delete(url)
};

export { TOKEN_KEY };
export default request;
