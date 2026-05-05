import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        const token = parsed.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.error('Token parse error:', e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const currentPath = window.location.pathname;
      
      switch (status) {
        case 401:
          if (currentPath !== '/login') {
            message.error('登录已过期，请重新登录');
            localStorage.removeItem('auth-storage');
            window.location.href = '/login';
          }
          break;
        case 403:
          message.error('权限不足');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器错误');
          break;
        default:
          if (data?.message) {
            message.error(data.message);
          }
      }
    } else if (error.request) {
      console.error('Network error:', error);
      message.error('网络错误，请检查网络连接');
    } else {
      console.error('Request error:', error);
      message.error('请求失败');
    }
    return Promise.reject(error);
  }
);

export const dormitoryApi = {
  getAll: (params?: any) => api.get('/dormitories', { params }),
  getById: (id: number) => api.get(`/dormitories/${id}`),
  getStats: () => api.get('/dormitories/stats'),
  create: (data: any) => api.post('/dormitories', data),
  update: (id: number, data: any) => api.put(`/dormitories/${id}`, data),
  delete: (id: number) => api.delete(`/dormitories/${id}`),
  getRooms: (dormitoryId: number, params?: any) => api.get(`/dormitories/${dormitoryId}/rooms`, { params }),
};

export const roomApi = {
  getAll: (params?: any) => api.get('/rooms', { params }),
  getById: (id: number) => api.get(`/rooms/${id}`),
  getAvailable: (params?: any) => api.get('/rooms/available', { params }),
  create: (data: any) => api.post('/rooms', data),
  update: (id: number, data: any) => api.put(`/rooms/${id}`, data),
  delete: (id: number) => api.delete(`/rooms/${id}`),
  getBeds: (roomId: number) => api.get(`/rooms/${roomId}/beds`),
};

export const bedApi = {
  getAll: (params?: any) => api.get('/rooms/beds', { params }),
  getById: (id: number) => api.get(`/rooms/beds/${id}`),
};

export const studentApi = {
  getAll: (params?: any) => api.get('/students', { params }),
  getById: (id: number) => api.get(`/students/${id}`),
  create: (data: any) => api.post('/students', data),
  update: (id: number, data: any) => api.put(`/students/${id}`, data),
  checkIn: (data: any) => api.post('/students/check-in', data),
  checkOut: (checkInId: number, data?: any) => api.post(`/students/check-out/${checkInId}`, data),
  getCheckInRecords: (params?: any) => api.get('/students/check-in/records', { params }),
  getCheckInRecordById: (id: number) => api.get(`/students/check-in/records/${id}`),
};

export const roomChangeApi = {
  getAll: (params?: any) => api.get('/room-changes', { params }),
  getById: (id: number) => api.get(`/room-changes/${id}`),
  create: (data: any) => api.post('/room-changes', data),
  approve: (id: number) => api.post(`/room-changes/${id}/approve`),
  reject: (id: number) => api.post(`/room-changes/${id}/reject`),
};

export const maintenanceApi = {
  getAll: (params?: any) => api.get('/maintenance', { params }),
  getById: (id: number) => api.get(`/maintenance/${id}`),
  getStats: () => api.get('/maintenance/stats'),
  create: (data: any) => api.post('/maintenance', data),
  update: (id: number, data: any) => api.put(`/maintenance/${id}`, data),
  process: (id: number) => api.post(`/maintenance/${id}/process`),
  complete: (id: number, data?: any) => api.post(`/maintenance/${id}/complete`, data),
};

export const reportApi = {
  getOverview: () => api.get('/reports/overview'),
  getDormitoryOccupancy: () => api.get('/reports/dormitory-occupancy'),
  getGenderDistribution: () => api.get('/reports/gender-distribution'),
  getMajorDistribution: () => api.get('/reports/major-distribution'),
  getRoomChangeStats: (params?: any) => api.get('/reports/room-change-stats', { params }),
  getMonthlyCheckin: (params?: any) => api.get('/reports/monthly-checkin', { params }),
  getMonthlyMaintenance: (params?: any) => api.get('/reports/monthly-maintenance', { params }),
  exportDormitory: () => api.get('/reports/export/dormitory', { responseType: 'blob' }),
};

export default api;