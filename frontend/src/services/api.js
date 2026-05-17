import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      config.headers['X-User-Id'] = userId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (response.data.success) {
      return response.data;
    } else {
      message.error(response.data.message || '请求失败');
      return Promise.reject(new Error(response.data.message));
    }
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          message.error('未登录，请先登录');
          localStorage.removeItem('userId');
          window.location.href = '/';
          break;
        case 403:
          message.error('无权限访问');
          break;
        case 404:
          message.error('资源不存在');
          break;
        case 500:
          message.error('服务器内部错误');
          break;
        default:
          message.error(data?.message || `请求失败 (${status})`);
      }
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请稍后重试');
    } else if (!window.navigator.onLine) {
      message.error('网络连接失败，请检查网络');
    } else {
      message.error('请求失败，请稍后重试');
    }
    return Promise.reject(error);
  }
);

let retryCount = 0;
const maxRetries = 1;

const requestWithRetry = async (config) => {
  try {
    return await api(config);
  } catch (error) {
    if (retryCount < maxRetries && !error.response) {
      retryCount++;
      console.log(`重试请求 ${retryCount}/${maxRetries}`);
      return requestWithRetry(config);
    }
    retryCount = 0;
    throw error;
  }
};

export const whitelistApi = {
  check: (phone) => requestWithRetry({ method: 'POST', url: '/whitelist/check', data: { phone } })
};

export const userApi = {
  register: (data) => requestWithRetry({ method: 'POST', url: '/user/register', data }),
  getInfo: () => requestWithRetry({ method: 'GET', url: '/user/info' })
};

export const commissionApi = {
  getList: () => requestWithRetry({ method: 'GET', url: '/commission/list' }),
  getDetail: (id) => requestWithRetry({ method: 'GET', url: `/commission/${id}` })
};

export const creditApi = {
  getInfo: () => requestWithRetry({ method: 'GET', url: '/credit/info' }),
  submit: (data) => requestWithRetry({ method: 'POST', url: '/credit/submit', data })
};

export const bankCardApi = {
  getList: () => requestWithRetry({ method: 'GET', url: '/bankcard/list' }),
  sendCode: (reservedPhone) => requestWithRetry({ method: 'POST', url: '/bankcard/send-code', data: { reservedPhone } }),
  bind: (data) => requestWithRetry({ method: 'POST', url: '/bankcard/bind', data })
};

export const advanceApi = {
  getList: () => requestWithRetry({ method: 'GET', url: '/advance/list' }),
  getPreCheck: (commissionId) => requestWithRetry({ method: 'GET', url: '/advance/precheck', params: { commissionId } }),
  submit: (data) => requestWithRetry({ method: 'POST', url: '/advance/submit', data })
};

export default api;
