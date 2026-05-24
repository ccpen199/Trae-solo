import axios from 'axios';
import { message } from 'antd';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

request.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code !== 200) {
      message.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    return res;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else {
      message.error(error.response?.data?.message || error.message || '网络错误');
    }
    return Promise.reject(error);
  }
);

export default request;

export const authApi = {
  login: (data: { username: string; password: string }) => request.post('/auth/login', data),
  register: (data: any) => request.post('/auth/register', data),
  profile: () => request.get('/auth/profile'),
  logout: () => request.post('/auth/logout')
};

export const vehicleApi = {
  list: (params?: any) => request.get('/vehicles', { params }),
  available: (params?: any) => request.get('/vehicles/available', { params }),
  detail: (id: number) => request.get(`/vehicles/${id}`),
  create: (data: any) => request.post('/vehicles', data),
  update: (id: number, data: any) => request.put(`/vehicles/${id}`, data),
  updateStatus: (id: number, status: string) => request.put(`/vehicles/${id}/status`, { status })
};

export const storeApi = {
  list: (params?: any) => request.get('/stores', { params }),
  all: () => request.get('/stores/all'),
  detail: (id: number) => request.get(`/stores/${id}`),
  create: (data: any) => request.post('/stores', data),
  update: (id: number, data: any) => request.put(`/stores/${id}`, data)
};

export const orderApi = {
  list: (params?: any) => request.get('/orders', { params }),
  detail: (id: number) => request.get(`/orders/${id}`),
  create: (data: any) => request.post('/orders', data),
  pay: (id: number) => request.put(`/orders/${id}/pay`),
  pickup: (id: number, data: any) => request.put(`/orders/${id}/pickup`, data),
  returnVehicle: (id: number, data: any) => request.put(`/orders/${id}/return`, data),
  settle: (id: number, data: any) => request.put(`/orders/${id}/settle`, data),
  cancel: (id: number) => request.put(`/orders/${id}/cancel`)
};

export const depositApi = {
  list: (params?: any) => request.get('/deposits', { params })
};

export const inspectionApi = {
  list: (params?: any) => request.get('/inspections', { params })
};

export const violationApi = {
  list: (params?: any) => request.get('/violations', { params }),
  create: (data: any) => request.post('/violations', data),
  updateStatus: (id: number, status: string, remark?: string) => request.put(`/violations/${id}/status`, { status, remark })
};

export const settlementApi = {
  list: (params?: any) => request.get('/settlements', { params })
};

export const licenseApi = {
  list: (params?: any) => request.get('/license', { params }),
  my: () => request.get('/license/my'),
  submit: (data: any) => request.post('/license', data),
  review: (id: number, data: any) => request.put(`/license/${id}/review`, data)
};

export const userApi = {
  list: (params?: any) => request.get('/users', { params }),
  customers: () => request.get('/users/customers'),
  updateStatus: (id: number, status: number) => request.put(`/users/${id}/status`, { status }),
  updateProfile: (data: any) => request.put('/users/profile', data),
  updatePassword: (data: any) => request.put('/users/password', data)
};

export const statsApi = {
  overview: () => request.get('/stats/overview'),
  vehicleStats: () => request.get('/stats/vehicle-stats'),
  orderStats: (params?: any) => request.get('/stats/order-stats', { params }),
  financeStats: (params?: any) => request.get('/stats/finance-stats', { params })
};
