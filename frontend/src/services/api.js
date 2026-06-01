import request from '../utils/request';

export const devicesApi = {
  getList: (params) => request.get('/devices', { params }),
  getDetail: (id) => request.get(`/devices/${id}`),
  create: (data) => request.post('/devices', data),
  update: (id, data) => request.put(`/devices/${id}`, data),
  delete: (id) => request.delete(`/devices/${id}`),
  updateTags: (id, data) => request.post(`/devices/${id}/tags`, data)
};

export const tagsApi = {
  getList: (params) => request.get('/tags', { params }),
  getDetail: (id) => request.get(`/tags/${id}`),
  create: (data) => request.post('/tags', data),
  update: (id, data) => request.put(`/tags/${id}`, data),
  delete: (id) => request.delete(`/tags/${id}`)
};

export const tasksApi = {
  getList: (params) => request.get('/tasks', { params }),
  getDetail: (id) => request.get(`/tasks/${id}`),
  create: (data) => request.post('/tasks', data),
  review: (id, data) => request.post(`/tasks/${id}/review`, data),
  delete: (id) => request.delete(`/tasks/${id}`)
};

export const reportsApi = {
  getStatistics: (params) => request.get('/reports/statistics', { params }),
  exportTasks: () => {
    window.open('http://localhost:48431/api/reports/export/tasks', '_blank');
  },
  exportDevices: () => {
    window.open('http://localhost:48431/api/reports/export/devices', '_blank');
  }
};
