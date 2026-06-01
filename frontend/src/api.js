import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const apiService = {
  getApplications: () => api.get('/applications'),
  getApplication: (id) => api.get(`/applications/${id}`),
  createApplication: (data) => api.post('/applications', data),
  updateApplication: (id, data) => api.put(`/applications/${id}`, data),
  
  getEnvironments: () => api.get('/environments'),
  createEnvironment: (data) => api.post('/environments', data),
  
  getVersions: () => api.get('/versions'),
  createVersion: (data) => api.post('/versions', data),
  
  getSecrets: () => api.get('/secrets'),
  createSecret: (data) => api.post('/secrets', data),
  
  getChangeOrders: () => api.get('/change-orders'),
  getChangeOrder: (id) => api.get(`/change-orders/${id}`),
  createChangeOrder: (data) => api.post('/change-orders', data),
  submitChangeOrder: (id, data) => api.post(`/change-orders/${id}/submit`, data),
  executeChangeOrder: (id, data) => api.post(`/change-orders/${id}/execute`, data),
  reviewChangeOrder: (id, data) => api.post(`/change-orders/${id}/review`, data),
  rejectChangeOrder: (id, data) => api.post(`/change-orders/${id}/reject`, data),
  closeChangeOrder: (id, data) => api.post(`/change-orders/${id}/close`, data),
  
  getExecutionTasks: () => api.get('/execution-tasks'),
  getTaskStatus: (id) => api.get(`/execution-tasks/${id}/status`),
  createExecutionTask: (data) => api.post('/execution-tasks', data),
  startTask: (id) => api.post(`/execution-tasks/${id}/start`),
  cancelTask: (id) => api.post(`/execution-tasks/${id}/cancel`),
  completeTask: (id, data) => api.post(`/execution-tasks/${id}/complete`, data),
  
  getCallLogs: () => api.get('/call-logs'),
  createCallLog: (data) => api.post('/call-logs', data),
  
  getAlarmRecords: () => api.get('/alarm-records'),
  handleAlarm: (id, data) => api.post(`/alarm-records/${id}/handle`, data),
  
  getOperationLogs: () => api.get('/operation-logs'),
  
  getClassificationRules: () => api.get('/classification-rules'),
  createClassificationRule: (data) => api.post('/classification-rules', data),
  
  getPermissions: () => api.get('/permissions'),
  createPermission: (data) => api.post('/permissions', data),
  
  getPermissionAudit: () => api.get('/permission-audit'),
  
  getDashboardStats: () => api.get('/dashboard/stats'),
  
  getUsers: () => api.get('/users'),
  
  exportData: (type) => {
    try {
      const link = document.createElement('a');
      link.href = `/api/export/${type}`;
      link.setAttribute('download', '');
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请重试');
    }
  }
};

export default api;
